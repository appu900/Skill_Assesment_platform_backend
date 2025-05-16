


// +-------------------+       +-------------------+       +-------------------+
// | Publisher Client  |<----->| Broker Node 1     |<----->| Broker Node 2     |
// | (gRPC)            |       | (Leader, Raft)    |       | (Follower, Raft)  |
// +-------------------+       | - Partitions: T1  |       | - Partitions: T2  |
//                             | - Storage: SQLite |       | - Storage: SQLite |
//                             | - Cache: Redis    |       | - Cache: Redis    |
//                             +-------------------+       +-------------------+
//                                     |                           |
//                                     v                           v
//                             +-------------------+       +-------------------+
//                             | Subscriber Client |<----->| Broker Node 3     |
//                             | (gRPC, Pub-Sub)  |       | (Follower, Raft)  |
//                             +-------------------+       | - Partitions: T3  |
//                                                        | - DLQ Storage     |
//                                                        +-------------------+    