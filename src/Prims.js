/*  https://www.geeksforgeeks.org/prims-minimum-spanning-tree-mst-greedy-algo-5/  
    Step 1: Determine an arbitrary vertex as the starting vertex of the MST.
    Step 2: Follow steps 3 to 5 till there are vertices that are not included 
            in the MST (known as fringe vertex).
    Step 3: Find edges connecting any tree vertex with the fringe vertices.
    Step 4: Find the minimum among these edges.
    Step 5: Add the chosen edge to the MST if it does not form any cycle.
    Step 6: Return the MST and exit
*/
export const prims = (() => {
  class MST {
    constructor(nodes) {
      this.nodes = nodes;
      this.nodeCount = nodes.length;

      return this.FindMST(this.nodes);
    }

    MinKey(key, mstSet) {
      // Initialize min value
      let min = Number.MAX_VALUE,
        min_index;

      for (let v = 0; v < this.nodeCount; v++)
        if (mstSet[v] == false && key[v] < min) (min = key[v]), (min_index = v);

      return min_index;
    }

    // A utility function to print the
    // constructed MST stored in parent[]
    printMST(parent, graph) {
      for (let i = 1; i < this.nodeCount; i++) {
        console.log("Edge:", parent[i], "-", i, "Weight:", graph[i][parent[i]]);
      }

      console.log(parent);
    }

    // Function to construct and print MST for
    // a graph represented using adjacency
    // matrix representation
    FindMST(graph) {
      // Array to store constructed MST
      let parent = [];

      // Key values used to pick minimum weight edge in cut
      let key = [];

      // To represent set of vertices included in MST
      let mstSet = [];

      // Initialize all keys as INFINITE
      for (let i = 0; i < this.nodeCount; i++)
        (key[i] = Number.MAX_VALUE), (mstSet[i] = false);

      // Always include first 1st vertex in MST.
      // Make key 0 so that this vertex is picked as first vertex.
      key[0] = 0;
      parent[0] = -1; // First node is always root of MST

      // The MST will have V vertices
      for (let count = 0; count < this.nodeCount - 1; count++) {
        // Pick the minimum key vertex from the
        // set of vertices not yet included in MST
        let u = this.MinKey(key, mstSet);

        // Add the picked vertex to the MST Set
        mstSet[u] = true;

        // Update key value and parent index of
        // the adjacent vertices of the picked vertex.
        // Consider only those vertices which are not
        // yet included in MST
        for (let v = 0; v < this.nodeCount; v++)
          // graph[u][v] is non zero only for adjacent vertices of m
          // mstSet[v] is false for vertices not yet included in MST
          // Update the key only if graph[u][v] is smaller than key[v]
          if (graph[u][v] && mstSet[v] == false && graph[u][v] < key[v])
            (parent[v] = u), (key[v] = graph[u][v]);
      }

      // print the constructed MST
      //this.printMST(parent, graph);
      return parent;
    }
  }

  return { MST: MST };
})();
