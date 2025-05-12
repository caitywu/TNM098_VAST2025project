// task2_main.jsx
import { useEffect, useState } from "react";
import { loadGraphData } from "./dataLoader";
import InfluenceTimeline from "./influenceTimeline";
// import TopInfluencedGenres from "./TopInfluencedGenres";
// import TopArtistsChart from "./TopArtistsChart";
// import OceanusShiftCompare from "./OceanusShiftCompare";

export default function Task2Main() {
  const [data, setData] = useState(null);

  useEffect(() => {
    loadGraphData("/MC1_graph.json").then(setData);
  }, []);

  if (!data) return <div>Loading data...</div>;

  return (
    <div style={{ padding: "1rem" }}>
      <InfluenceTimeline data={data} />
      {/* <TopInfluencedGenres data={data} />
      <TopArtistsChart data={data} />
      <OceanusShiftCompare data={data} /> */}
    </div>
  );
}
