import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NetworkGraph from './NetworkGraph.jsx';
import Task2Main from './task2/task2_main.jsx';
import Layout from './task2/layout.jsx';
import GenreMatrixMain from './task2/GenreMatricesMain.jsx';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<NetworkGraph />} />
          <Route path="task2" element={<Task2Main />} />
          <Route path="matrix" element={<GenreMatrixMain />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;