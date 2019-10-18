type Edge = {
  u?: number
  v: number
  c: number
  f: number
  r: number
}

export class Graph {
  private level: number[]
  private edges: Edge[][]
  private v: number

  constructor(menge_v: number) {
    this.v = menge_v // Vertex count
    this.level = Array(menge_v)

    // Array: for every vertex an edge Array mit {v,r,c,f} vertex_to,res_edge,capacity,flow
    this.edges = Array(menge_v).fill(0).map(_ => [])
  }

  public newEdge(u: number, v: number, c: number): void {
    // Adds new edge from u to v
    this.edges[u].push({
      v,
      c,
      r: this.edges[v].length,
      f: 0
    })

    // Normal forward Edge
    this.edges[v].push({
      v: u,
      r: this.edges[u].length - 1,
      c: 0,
      f: 0
    }) // reverse Edge for Residal Graph
  }

  private BFS(s: number, t: number): boolean {
    // calculates Level Graph and if theres a path from s to t
    if (t >= this.v) {
      return false
    }

    this.level.fill(-1) // reset old levels
    this.level[s] = 0

    const q = [] // queue with s as starting point

    q.push(s)

    while (q.length) {
      const u = q.splice(0, 1)[0]
      for (let i = 0; i < this.edges[u].length; i++) {
        const edge: Edge = this.edges[u][i]
        if (this.level[edge.v] < 0 && edge.f < edge.c) {
          this.level[edge.v] = this.level[u] + 1
          q.push(edge.v)
        }
      }
    }

    return this.level[t] >= 0 // return if theres a path to t -> no level, no path!
  }

  // DFS like: send flow at along path from s->t recursivly while increasing the level of the visited vertices by one
  // u vertex, f flow on path, t =Sink , c Array, c[i] saves the count of edges explored from vertex i
  private DFSFlow(u: number, f: number, t: number, c: number[]): number {
    if (u === t) {
      // Sink reached , aboard recursion
      return f
    }

    while (c[u] < this.edges[u].length) {
      // Visit all edges of the vertex  one after the other
      const edge = this.edges[u][c[u]]

      if (this.level[edge.v] === this.level[u] + 1 && edge.f < edge.c) {
        // Edge leads to Vertex with a level one higher, and has flow left
        const flow_till_here = Math.min(f, edge.c - edge.f)
        const flow_to_t = this.DFSFlow(edge.v, flow_till_here, t, c)

        if (flow_to_t > 0) {
          edge.f += flow_to_t // Add Flow to current edge
          this.edges[edge.v][edge.r].f -= flow_to_t // subtract from reverse Edge -> Residual Graph neg. Flow to use backward direction of BFS/DFS
          return flow_to_t
        }
      }

      c[u]++
    }

    return 0
  }

  public BFSTheCut(s: number): number[] {
    // breadth-first-search which uses the level array to mark the vertices reachable from s
    const e_in_cut = []

    this.level.fill(-1)
    this.level[s] = 1

    const q = []

    q.push(s)

    while (q.length) {
      const u = q.splice(0, 1)[0]

      for (let i = 0; i < this.edges[u].length; i++) {
        const edge: Edge = this.edges[u][i]

        if (edge.f < edge.c) {
          if (this.level[edge.v] < 1) {
            this.level[edge.v] = 1
            q.push(edge.v)
          }
        }

        if (edge.f === edge.c && edge.c > 0) {
          // blocking edge -> could be in min cut
          edge.u = u
          e_in_cut.push(edge)
        }
      }
    }

    let min_cut: number[] = []

    for (let i = 0; i < e_in_cut.length; i++) {
      if (this.level[e_in_cut[i].v] === -1) {
        // Only edges which are blocking and lead to from s unreachable vertices are in the min cut
        min_cut.push(e_in_cut[i].u as number)
      }
    }

    return min_cut
  }

  public getMinCut(s: number, t: number): number {
    // calculates min-cut graph (Dinic Algorithm)
    if (s == t) {
      return -1
    }

    let returnvalue = 0

    while (this.BFS(s, t) === true) {
      const count = Array(this.v + 1).fill(0)
      let flow = 0

      do {
        flow = this.DFSFlow(s, Number.MAX_VALUE, t, count)
        if (flow > 0) returnvalue += flow
      } while (flow)
    }

    return returnvalue
  }
}

