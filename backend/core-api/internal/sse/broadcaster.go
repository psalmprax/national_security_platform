package sse

import (
	"fmt"
	"net/http"
	"sync"
)

// Broadcaster handles the SSE client connections logic
type Broadcaster struct {
	clients    map[chan string]bool
	newClients chan chan string
	defClients chan chan string
	messages   chan string
	mutex      sync.RWMutex
}

// Stream is the global broadcaster instance
var Stream *Broadcaster

// Init initializes the SSE stream
func Init() {
	Stream = &Broadcaster{
		clients:    make(map[chan string]bool),
		newClients: make(chan chan string),
		defClients: make(chan chan string),
		messages:   make(chan string),
	}
	go Stream.start()
}

func (b *Broadcaster) start() {
	for {
		select {
		case s := <-b.newClients:
			b.mutex.Lock()
			b.clients[s] = true
			b.mutex.Unlock()
			fmt.Println("New SSE client connected") // Debug

		case s := <-b.defClients:
			b.mutex.Lock()
			if _, ok := b.clients[s]; ok {
				delete(b.clients, s)
				close(s)
			}
			b.mutex.Unlock()
			fmt.Println("SSE client disconnected") // Debug

		case msg := <-b.messages:
			b.mutex.RLock()
			for s := range b.clients {
				// Non-blocking send to avoid one slow client blocking everyone
				select {
				case s <- msg:
				default:
					// Drop message if client is blocked? Or queue?
					// For simple status updates, dropping is often acceptable or better than blocking.
				}
			}
			b.mutex.RUnlock()
		}
	}
}

// HandleEvents is the HTTP handler for SSE
func (b *Broadcaster) HandleEvents(w http.ResponseWriter, r *http.Request) {
	// CORS and Headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*") // Adjust for production

	messageChan := make(chan string, 10) // Buffer slightly
	b.newClients <- messageChan

	// Heartbeat to keep connection alive
	// go func() ... ?

	notify := r.Context().Done()
	go func() {
		<-notify
		b.defClients <- messageChan
	}()

	for {
		msg, open := <-messageChan
		if !open {
			break
		}
		_, err := fmt.Fprintf(w, "data: %s\n\n", msg)
		if err != nil {
			break
		}
		if f, ok := w.(http.Flusher); ok {
			f.Flush()
		}
	}
}

// Broadcast sends a message to all clients
func Broadcast(msg string) {
	if Stream != nil {
		Stream.messages <- msg
	}
}
