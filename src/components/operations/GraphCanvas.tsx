import { useMemo } from "react";

import type { ProjectGraph } from "@/lib/api";

interface GraphCanvasProps {
  graph: ProjectGraph;
}

export function GraphCanvas({ graph }: GraphCanvasProps) {
  const layout = useMemo(() => {
    const indegree = new Map<string, number>();
    const outgoing = new Map<string, string[]>();
    const nodesById = new Map(graph.nodes.map((node) => [node.node_id, node]));

    graph.nodes.forEach((node) => {
      indegree.set(node.node_id, 0);
      outgoing.set(node.node_id, []);
    });

    graph.edges.forEach((edge) => {
      if (!indegree.has(edge.target)) return;
      indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1);
      outgoing.set(edge.source, [...(outgoing.get(edge.source) || []), edge.target]);
    });

    const queue = graph.nodes.filter((node) => (indegree.get(node.node_id) || 0) === 0).map((node) => node.node_id);
    const levels = new Map<string, number>();
    queue.forEach((id) => levels.set(id, 0));

    while (queue.length) {
      const current = queue.shift()!;
      const currentLevel = levels.get(current) || 0;
      (outgoing.get(current) || []).forEach((child) => {
        levels.set(child, Math.max(levels.get(child) || 0, currentLevel + 1));
        indegree.set(child, (indegree.get(child) || 0) - 1);
        if ((indegree.get(child) || 0) <= 0) queue.push(child);
      });
    }

    const grouped = new Map<number, string[]>();
    graph.nodes.forEach((node) => {
      const level = levels.get(node.node_id) || 0;
      grouped.set(level, [...(grouped.get(level) || []), node.node_id]);
    });

    const positions = new Map<string, { x: number; y: number }>();
    const cardWidth = 180;
    const cardHeight = 76;
    const horizontalGap = 80;
    const verticalGap = 42;
    const maxLevel = Math.max(...Array.from(grouped.keys()), 0);

    Array.from(grouped.entries()).forEach(([level, nodeIds]) => {
      nodeIds.forEach((nodeId, index) => {
        positions.set(nodeId, {
          x: 30 + level * (cardWidth + horizontalGap),
          y: 30 + index * (cardHeight + verticalGap),
        });
      });
    });

    const width = 60 + (maxLevel + 1) * (cardWidth + horizontalGap);
    const maxNodesInColumn = Math.max(...Array.from(grouped.values()).map((items) => items.length), 1);
    const height = 60 + maxNodesInColumn * (cardHeight + verticalGap);

    return { nodesById, positions, width, height, cardWidth, cardHeight };
  }, [graph]);

  return (
    <div className="overflow-auto rounded-2xl border border-white/10 bg-black/20 p-4">
      <svg width={layout.width} height={layout.height} className="min-w-full">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
          </marker>
        </defs>

        {graph.edges.map((edge, index) => {
          const source = layout.positions.get(edge.source);
          const target = layout.positions.get(edge.target);
          if (!source || !target) return null;
          const startX = source.x + layout.cardWidth;
          const startY = source.y + layout.cardHeight / 2;
          const endX = target.x;
          const endY = target.y + layout.cardHeight / 2;
          const midX = (startX + endX) / 2;

          return (
            <path
              key={`${edge.source}-${edge.target}-${index}`}
              d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
              fill="none"
              stroke={edge.type === "fallback" ? "#f59e0b" : edge.type === "observed" ? "#22c55e" : "#60a5fa"}
              strokeWidth={Math.max(1.5, Math.min(4, edge.weight))}
              markerEnd="url(#arrow)"
              opacity={0.8}
            />
          );
        })}

        {graph.nodes.map((node) => {
          const position = layout.positions.get(node.node_id);
          if (!position) return null;

          return (
            <g key={node.node_id} transform={`translate(${position.x}, ${position.y})`}>
              <rect width={layout.cardWidth} height={layout.cardHeight} rx="18" fill={node.is_root ? "rgba(59,130,246,0.18)" : "rgba(15,23,42,0.82)"} stroke={node.failure_count > 0 ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.12)"} />
              <text x="16" y="24" fill="white" fontSize="13" fontWeight="700">{node.name}</text>
              <text x="16" y="44" fill="rgba(255,255,255,0.65)" fontSize="11">Runs: {node.execution_count}</text>
              <text x="16" y="60" fill="rgba(255,255,255,0.65)" fontSize="11">Failures: {node.failure_count}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
