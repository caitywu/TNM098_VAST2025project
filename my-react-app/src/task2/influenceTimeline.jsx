import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine,
} from "recharts";

const influenceTypes = [
  "InStyleOf",
  "InterpolatesFrom",
  "CoverOf",
  "LyricalReferenceTo",
  "DirectlySamples",
];

export default function InfluenceTimeline({ data }) {
  const yearlyData = useMemo(() => {
    const counts = {};
    const { nodes, links } = data;

    const oceanusIds = new Set(
      nodes.filter(n => n.genre === "Oceanus Folk").map(n => n.id)
    );

    for (let link of links) {
      const type = link["Edge Type"];
      if (!influenceTypes.includes(type)) continue;

      const sourceIsOceanus = oceanusIds.has(link.source);
      const targetIsOceanus = oceanusIds.has(link.target);
      if (!(sourceIsOceanus || targetIsOceanus)) continue;

      const linkedNode = nodes.find(n =>
        sourceIsOceanus ? n.id === link.target : n.id === link.source
      );
      if (!linkedNode) continue;

      const year = linkedNode.release_date || linkedNode.notoriety_date;
      if (!year) continue;

      if (!counts[year]) {
        counts[year] = { year };
        influenceTypes.forEach(type => (counts[year][type] = 0));
        counts[year].total = 0;
      }

      counts[year][type]++;
      counts[year].total++;
    }

    return Object.values(counts).sort((a, b) => a.year.localeCompare(b.year));
  }, [data]);

  const colors = {
    InStyleOf: "#007acc",
    InterpolatesFrom: "#d67f00",
    CoverOf: "#6a3d9a",
    LyricalReferenceTo: "#e31a1c",
    DirectlySamples: "#1f78b4",
  };

  // Create the tooltip formatter
  const customTooltip = ({ payload, label }) => {
    if (!payload || payload.length === 0) return null;

    const total = payload.find(p => p.name === "total")?.value || 0;
    const tooltipContent = influenceTypes.map(type => {
      const item = payload.find(p => p.name === type);
      return item ? (
        <div key={type} style={{ color: colors[type], marginBottom: "5px" }}>
          {`${type}: ${item.value}`}
        </div>
      ) : null;
    });

    return (
      <div
        style={{
          backgroundColor: "white",  // White background for the tooltip box
          border: "1px solid #ccc", // Light gray border
          borderRadius: "5px",      // Rounded corners
          padding: "10px",          // Padding inside the tooltip
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Optional shadow for depth
        }}
      >
        <p style={{ margin: 0 }}>Year: {label}</p>
        <p style={{ margin: "5px 0" }}>Total: {total}</p>
        {tooltipContent}
      </div>
    );
  };

  return (
    <div>
      <h3>Outgoing Oceanus Folk Influence Over Time</h3>
      <LineChart
        width={900}
        height={350}
        data={yearlyData}
        margin={{ top: 50, right: 30, bottom: 20, left: 20 }} // Add padding around the chart
      >
        <XAxis
          dataKey="year"
          type="category"
          tick={{ fill: "#333" }}  // Set tick color to a darker shade (e.g., #333)
        />
        <YAxis
          tick={{ fill: "#333" }}  // Set tick color to a darker shade (e.g., #333)
        />
        <CartesianGrid strokeDasharray="3 3" />

        {/* Add the vertical red line and label for 2028 */}
        <ReferenceLine
          x="2028"  // Use a string to match the year in the data
          stroke="red"
          strokeWidth={2}
          label={{
            value: "Rise of Sailor Shift",
            position: "top",  // Move label to top of the chart
            fill: "red",
            fontSize: 12,
          }}
        />

        <Tooltip content={customTooltip} />
        <Legend />
        <Line
          type="monotone"
          dataKey="total"
          stroke="black"
          strokeWidth={2}
          dot={false}
        />
        {influenceTypes.map(type => (
          <Line
            key={type}
            type="monotone"
            dataKey={type}
            stroke="transparent" // Hide the individual lines
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </div>
  );
}
