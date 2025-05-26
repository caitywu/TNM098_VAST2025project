import React, { useState, useEffect } from 'react'

function FetchData() {
  const [nodes, setNodes] = useState([])

  useEffect(() => {
    fetch('/MC1_graph.json')  // laddas från public/
      .then(response => response.json())
      .then(data => setNodes(data.nodes))
      .catch(error => console.error("Fel vid laddning:", error))
  }, []) // tom array = bara första gången

  return (
    <div>
      <h2>Persons</h2>
      {nodes.
      filter(node => node["Node Type"] === "Person")
      .slice(0, 100) // Visa bara de första 10
      .map((node, i) => (
        <div key={node.id}>
          <p><strong>{node["Node Type"]}</strong> - {node.name}</p>
        </div>
      ))}
    </div>
  )
}


export default FetchData