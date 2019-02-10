## Process Block Control (PCB)

A Process Control Block is a data structure maintained by the Operating System for every process. The PCB is identified by an integer process ID (PID). A PCB keeps all the information needed to keep track of a process as listed below in the table -


| Information | Description |
|:-----------:|:-----------:|
| Process State | The current state of the process i.e., ALIVE, IDLE, and DEAD. |
| Process ID | Unique identification for each of the process in the operating system. |
| Pointer | A pointer to parent process. |
| Program Counter | Program Counter is a pointer to the address of the next instruction to be executed for this process. |
| CPU Scheduling Information | Process priority and other scheduling information which is required to schedule the process. |
| Memory management information | This includes the information of page table, memory limits, Segment table depending on memory used by the operating system. |
| Accounting information | This includes the amount of CPU used for process execution, time limits, execution ID etc. |
| Resources | Lists of resources allocated to this process. |
