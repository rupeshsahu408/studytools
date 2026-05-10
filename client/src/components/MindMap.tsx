import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, Network, X, Lightbulb } from "lucide-react";

interface MindNode {
  id: string;
  label: string;
  explanation: string;
  children: MindNode[];
}

interface MindMapData {
  title: string;
  root: MindNode;
}

interface MindMapProps {
  mindmap: MindMapData;
}

const DEPTH_STYLES = [
  { dot: "w-4 h-4 bg-green-600", label: "text-base font-bold text-gray-900 dark:text-white", line: "border-green-200 dark:border-green-800" },
  { dot: "w-3 h-3 bg-blue-500", label: "text-sm font-semibold text-gray-800 dark:text-gray-200", line: "border-blue-200 dark:border-blue-800" },
  { dot: "w-2.5 h-2.5 bg-purple-500", label: "text-sm font-medium text-gray-700 dark:text-gray-300", line: "border-purple-200 dark:border-purple-700" },
  { dot: "w-2 h-2 bg-orange-400", label: "text-xs font-medium text-gray-600 dark:text-gray-400", line: "border-orange-200 dark:border-orange-700" },
];

function TreeNodeComponent({
  node,
  depth,
  onSelect,
  selectedId,
}: {
  node: MindNode;
  depth: number;
  onSelect: (node: MindNode) => void;
  selectedId: string | null;
}) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const style = DEPTH_STYLES[Math.min(depth, DEPTH_STYLES.length - 1)];
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all group ${
          isSelected
            ? "bg-green-50 dark:bg-green-900/20 ring-1 ring-green-200 dark:ring-green-800"
            : "hover:bg-gray-50 dark:hover:bg-gray-800"
        }`}
        onClick={() => {
          onSelect(node);
          if (hasChildren) setIsOpen(o => !o);
        }}>
        {/* Dot */}
        <div className={`rounded-full flex-shrink-0 ${style.dot} ${isSelected ? "ring-2 ring-green-500 ring-offset-2" : ""}`} />

        {/* Label */}
        <span className={`flex-1 leading-snug ${style.label}`}>{node.label}</span>

        {/* Expand/collapse icon */}
        {hasChildren && (
          <span className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 flex-shrink-0">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        )}
      </div>

      {/* Children */}
      <AnimatePresence>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`ml-5 mt-1 pl-4 border-l-2 space-y-1 ${style.line}`}>
            {node.children.map(child => (
              <TreeNodeComponent
                key={child.id}
                node={child}
                depth={depth + 1}
                onSelect={onSelect}
                selectedId={selectedId}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MindMap({ mindmap }: MindMapProps) {
  const [selectedNode, setSelectedNode] = useState<MindNode | null>(mindmap.root);

  if (!mindmap || !mindmap.root) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        Mind map data is not available.
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Network className="w-5 h-5 text-green-600" /> Concept Map
          <span className="text-sm font-normal text-gray-400 ml-1">{mindmap.title}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4 items-start">
        {/* Tree */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3 ml-2">
            Click any concept to see its explanation
          </div>
          <TreeNodeComponent
            node={mindmap.root}
            depth={0}
            onSelect={setSelectedNode}
            selectedId={selectedNode?.id || null}
          />
        </div>

        {/* Explanation panel */}
        <div className="sticky top-20">
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div
                key={selectedNode.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{selectedNode.label}</h3>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {selectedNode.explanation || "Click any node in the map to see its explanation here."}
                </p>
                {selectedNode.children && selectedNode.children.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Sub-topics</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNode.children.map(c => (
                        <span key={c.id}
                          className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-lg cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                          onClick={() => setSelectedNode(c)}>
                          {c.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 text-center">
                <Network className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">Click any concept in the map to see its explanation here</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {[
          { color: "bg-green-600", label: "Chapter" },
          { color: "bg-blue-500", label: "Main Topics" },
          { color: "bg-purple-500", label: "Subtopics" },
          { color: "bg-orange-400", label: "Details" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
