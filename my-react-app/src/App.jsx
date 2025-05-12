// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'
// import FetchData from './fetchdata.jsx' // Importera din komponent
// import NetworkGraph from './NetworkGraph.jsx' // Importera din komponent

// function App() {
//   //const [count, setCount] = useState(0)

//   return (
//     <>
//       <h1>Musical Network</h1>
//       <NetworkGraph />
//       {/* <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div> */}
//       {/* <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p> */}
//       {/* <FetchData /> 👈 Här visas innehållet från din JSON */}

//     </>
//   )
// }

// export default App



// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NetworkGraph from './NetworkGraph.jsx';
import Task2Main from './task2/task2_main.jsx';
import Layout from './task2/layout.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<NetworkGraph />} />
          <Route path="task2" element={<Task2Main />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;


