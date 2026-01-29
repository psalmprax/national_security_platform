# Scaling & Deployment Guide

This document outlines how to scale the National Security Platform using Docker and Kubernetes (K8s) for national-layer deployment.

## 📊 Component Scaling Matrix

| Service | Scaling Type | Docker Approach | Kubernetes Approach |
| :--- | :--- | :--- | :--- |
| **Core API (Go)** | Horizontal | `docker-compose up --scale core-api=3` | **HPA** (Horizontal Pod Autoscaler) based on CPU/Request rate. |
| **Intel Service (Python)** | Horizontal | Scale up containers; requires external load balancer (NGINX/LB). | **HPA** + **GPU Node Tainting**. Scale based on gRPC queue depth. |
| **Web Dashboard** | Horizontal | Simple replication; use NGINX as reverse proxy. | **HPA** + **Ingress Controller** (sticky sessions optional). |
| **CockroachDB** | Cluster | Manual addition of nodes to the compose network. | **StatefulSet** + **Cockroach Operator**. Native horizontal expansion. |
| **NATS JetStream** | Cluster | Configure 3-node cluster in YAML. | **StatefulSet** + **NATS Operator**. RAFT-based consensus scaling. |
| **Redis** | Cluster/Sentinel | Manual master-slave setup. | **Redis Operator** (Cluster Mode) for sharded memory scaling. |

---

## 🏗 Why Kubernetes (K8s) for Production?

While Docker Compose is excellent for development and small-scale pilots, a national security platform requires K8s for the following:

### 1. Self-Healing (Resilience)
If a `core-api` container crashes on a single Docker host, you lose capacity. In K8s, if a Node fails, the Control Plane automatically relocates the Pods to healthy hardware.

### 2. Zero-Downtime Updates
K8s supports **Rolling Updates**. You can roll out Version 2 of the Intelligence Service one pod at a time, ensuring service is never interrupted during a national crisis.

### 3. Traffic Scrubbing (WAF)
K8s Ingress Controllers (like Kong or Cloud Armor) can be configured to drop DDoS traffic at the edge before it ever reaches your Go API.

---

## ⚙️ Scaling Specific Layers

### Mobile & Ingestion Layer
Since the Mobile app is "Offline-First," high traffic comes in "bursts" when connectivity returns to a region. 
- **Strategy**: Scale the `core-api` aggressively during the morning "sync window" using K8s CronJobs or load-based scaling.

### Intelligence Analysis Layer
The Python service performs heavy lifting (NLP, Hashing). 
- **Strategy**: Use **Horizontal Pod Autoscaling (HPA)**. Scale the Python service based on the number of pending messages in the NATS `alerts.new` stream.

### Database Layer
CockroachDB is the most scalable part of this stack.
- **Strategy**: Deploy nodes across different geopolitical zones (e.g., Lagos, Abuja, Kano). CockroachDB will automatically route users to the nearest node for lowest latency.

---

## 🧩 Deep Dive: Native Clustering for Stateful Services

Unlike stateless apps (like the Go API) that can be cloned simply, **Stateful Services** must manage data consistency while scaling. Our stack uses "Native Clustering" to ensure that if one pod or city goes offline, the data remains safe and available.

### 1. CockroachDB (The Distributed SQL Layer)
CockroachDB doesn't use a "Primary/Secondary" model. Instead, every node is equal.
- **Raft Consensus**: Data is split into "Ranges" (shards). Each range is replicated 3 or 5 times across different nodes/cities.
- **Auto-Rebalancing**: If you add a new node in Kano, CockroachDB automatically notices and moves some data ranges there to balance the load.
- **Geo-Partitioning**: You can tell the database: *"Keep users from Borno on servers in Maiduguri, but replicate a backup to Abuja."* This reduces latency for local users while maintaining national disaster recovery.

### 2. NATS JetStream (The Message Fabric)
NATS uses a highly lightweight clustering system.
- **Replication Factor**: When an alert is published, NATS JetStream ensures it is written to a quorum (majority) of nodes before acknowledging.
- **Leaf Nodes**: For rural areas with poor connectivity, we can deploy "Leaf Nodes." These are tiny NATS instances that hold alerts locally and "bridge" them to the regional cluster as soon as the internet returns.
- **Super-clusters**: You can connect clusters in different regions (SW, SE, NW, NE, etc.) into a "Super-cluster" that shares the national alert load.

### 3. Redis (The Real-time Cache)
- **Redis Cluster**: Data is automatically partitioned across multiple Redis nodes using "hash slots."
- **Sentinel**: Monitors the health of the nodes and automatically promotes a "Slave" to "Master" if a failure is detected, ensuring the Web Dashboard's real-time map never freezes.

---

## 🗺 Visualization: National Geo-Clustering

```mermaid
graph TD
    subgraph "Abuja (National HQ)"
        N1[CockroachDB Node A]
        M1[NATS Cluster Node 1]
    end
    subgraph "Lagos (South Hub)"
        N2[CockroachDB Node B]
        M2[NATS Cluster Node 2]
    end
    subgraph "Kano (North Hub)"
        N3[CockroachDB Node C]
        M3[NATS Cluster Node 3]
    end

    N1 <-->|Raft Sync| N2
    N2 <-->|Raft Sync| N3
    N3 <-->|Raft Sync| N1

    M1 <-->|Gossip Protocol| M2
    M2 <-->|Gossip Protocol| M3
    M3 <-->|Gossip Protocol| M1

    Style N1 fill:#008751,color:#fff
    Style M1 fill:#008751,color:#fff
```

## 🏗 Why this matters for "National Security"
1. **Network Partitioning**: If a state’s internet is cut off, the local "Leaf Nodes" and "DB Nodes" keep working. Once the cut is repaired, they automatically sync back to the national headquarters.
2. **Zero Single Point of Failure**: You can lose an entire Data Center in one city, and the platform remains 100% operational using the other regional hubs.
