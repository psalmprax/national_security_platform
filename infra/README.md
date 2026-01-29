# Cloud Infrastructure & State Management

In our **Local Development** (`docker-compose.yml`), we run stateful services like Databases and Caches as local Docker containers.
In **Production (Kubernetes)**, we **DO NOT** deploy these stateful services inside the cluster (usually). Instead, we use **Managed Cloud Services** for reliability, backups, and scaling.

Below is the mapping of our local services to their Production/Cloud equivalents.

## Service Mapping

| Service | Local (Docker Compose) | Production (AWS) | Production (GCP) | Production (Azure) |
| :--- | :--- | :--- | :--- | :--- |
| **Relational DB** | `cockroachdb` container | **Amazon Aurora (Postgres)** or EC2 with CockroachDB Enterprise | **Cloud SQL (PostgreSQL)** or CockroachDB Dedicated | **Azure Database for PostgreSQL** |
| **Cache / Queue** | `redis` container | **Amazon ElastiCache for Redis** | **Memorystore for Redis** | **Azure Cache for Redis** |
| **Object Storage** | Local Volume / MinIO | **Amazon S3** | **Google Cloud Storage** | **Azure Blob Storage** |

## Why not run DBs in Kubernetes?
While possible using "StatefulSets" and "Operators", running a production-grade database inside K8s is complex. Managed services (like RDS/CloudSQL) handle:
1.  **Backups**: Automated daily snapshots.
2.  **Failover**: If the primary node dies, the cloud provider instantly switches to a standby.
3.  **Patching**: Security updates are applied automatically.

## Infrastructure as Code (Terraform)
*Note: In future phases, we will add Terraform scripts here to automatically provision these cloud resources.*
