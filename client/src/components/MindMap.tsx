import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronDown, Network, X, Lightbulb,
  ChevronsDownUp, ChevronsUpDown, Search, BookOpen,
  FlaskConical, Calculator, Hash,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Depth colour system (4 levels) ──────────────────────────────────────────

const DEPTH_CONFIG = [
  {
    dot: "w-5 h-5 bg-green-600 ring-2 ring-green-200 dark:ring-green-800",
    label: "text-base font-bold text-gray-900 dark:text-white",
    line: "border-green-300 dark:border-green-700",
    badge: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400",
    pill: "bg-green-600",
  },
  {
    dot: "w-3.5 h-3.5 bg-blue-500 ring-2 ring-blue-100 dark:ring-blue-900",
    label: "text-sm font-semibold text-gray-800 dark:text-gray-100",
    line: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
    pill: "bg-blue-500",
  },
  {
    dot: "w-2.5 h-2.5 bg-purple-500",
    label: "text-sm font-medium text-gray-700 dark:text-gray-300",
    line: "border-purple-200 dark:border-purple-700",
    badge: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400",
    pill: "bg-purple-500",
  },
  {
    dot: "w-2 h-2 bg-orange-400",
    label: "text-xs font-medium text-gray-600 dark:text-gray-400",
    line: "border-orange-200 dark:border-orange-700",
    badge: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400",
    pill: "bg-orange-400",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countNodes(node: MindNode): number {
  return 1 + node.children.reduce((s, c) => s + countNodes(c), 0);
}

function collectAllIds(node: MindNode): Set<string> {
  const ids = new Set<string>([node.id]);
  node.children.forEach(c => collectAllIds(c).forEach(id => ids.add(id)));
  return ids;
}

function matchesSearch(node: MindNode, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (node.label.toLowerCase().includes(q)) return true;
  if (node.explanation.toLowerCase().includes(q)) return true;
  return node.children.some(c => matchesSearch(c, q));
}

// ─── Tree node ────────────────────────────────────────────────────────────────

function TreeNode({
  node, depth, onSelect, selectedId, expandedIds, toggleExpand, searchQuery,
}: {
  node: MindNode;
  depth: number;
  onSelect: (n: MindNode) => void;
  selectedId: string | null;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  searchQuery: string;
}) {
  const cfg = DEPTH_CONFIG[Math.min(depth, DEPTH_CONFIG.length - 1)];
  const hasChildren = node.children.length > 0;
  const isOpen = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  // highlight matching nodes
  const isMatch = searchQuery
    ? node.label.toLowerCase().includes(searchQuery.toLowerCase())
    : false;

  // hide nodes that don't match search at all (but keep ancestors that have matching descendants)
  if (searchQuery && !matchesSearch(node, searchQuery)) return null;

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: depth * 0.03 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all group select-none ${
          isSelected
            ? "bg-green-50 dark:bg-green-900/20 ring-1 ring-green-300 dark:ring-green-700"
            : isMatch
            ? "bg-yellow-50 dark:bg-yellow-900/10 ring-1 ring-yellow-200 dark:ring-yellow-800"
            : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
        }`}
        onClick={() => {
          onSelect(node);
          if (hasChildren) toggleExpand(node.id);
        }}
      >
        {/* Colour dot */}
        <div className={`rounded-full flex-shrink-0 transition-transform group-hover:scale-110 ${cfg.dot}`} />

        {/* Label */}
        <span className={`flex-1 leading-snug ${cfg.label}`}>
          {isMatch && searchQuery ? (
            <HighlightMatch text={node.label} query={searchQuery} />
          ) : (
            node.label
          )}
        </span>

        {/* Child count badge */}
        {hasChildren && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${cfg.badge}`}>
            {node.children.length}
          </span>
        )}

        {/* Expand chevron */}
        {hasChildren && (
          <span className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 flex-shrink-0">
            {isOpen
              ? <ChevronDown className="w-3.5 h-3.5" />
              : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        )}
      </motion.div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {isOpen && hasChildren && (
          <motion.div
            key="children"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={`ml-4 mt-0.5 pl-4 border-l-2 space-y-0.5 overflow-hidden ${cfg.line}`}
          >
            {node.children.map(child => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                onSelect={onSelect}
                selectedId={selectedId}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
                searchQuery={searchQuery}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Highlight matching text ──────────────────────────────────────────────────

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-700 text-inherit rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MindMap({ mindmap }: MindMapProps) {
  const [selectedNode, setSelectedNode] = useState<MindNode | null>(mindmap.root);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Auto-expand root + all depth-1 nodes by default
    const ids = new Set<string>([mindmap.root.id]);
    mindmap.root.children.forEach(c => ids.add(c.id));
    return ids;
  });
  const [searchQuery, setSearchQuery] = useState("");

  const allIds = useMemo(() => collectAllIds(mindmap.root), [mindmap.root]);
  const totalNodes = useMemo(() => countNodes(mindmap.root), [mindmap.root]);
  const mainTopics = mindmap.root.children.length;
  const subTopics = mindmap.root.children.reduce((s, c) => s + c.children.length, 0);
  const leafNodes = totalNodes - 1 - mainTopics - subTopics;

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(allIds));
  }, [allIds]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set([mindmap.root.id]));
  }, [mindmap.root.id]);

  const allExpanded = expandedIds.size === allIds.size;

  if (!mindmap?.root) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        Concept map data is not available.
      </div>
    );
  }

  return (
    <div className="max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Network className="w-5 h-5 text-green-600" />
          Concept Map
          <span className="text-sm font-normal text-gray-400 ml-1">{mindmap.title}</span>
        </h2>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search concepts…"
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 w-44"
            />
          </div>

          {/* Expand / Collapse */}
          <button
            onClick={allExpanded ? collapseAll : expandAll}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {allExpanded
              ? <><ChevronsDownUp className="w-3.5 h-3.5" /> Collapse All</>
              : <><ChevronsUpDown className="w-3.5 h-3.5" /> Expand All</>}
          </button>
        </div>
      </div>

      {/* ── Coverage stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {[
          { icon: BookOpen,     value: mainTopics,  label: "Main Topics",  color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-900/20"   },
          { icon: Hash,         value: subTopics,   label: "Sub-topics",   color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
          { icon: FlaskConical, value: Math.max(leafNodes, 0), label: "Key Details", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
          { icon: Calculator,   value: totalNodes,  label: "Total Nodes",  color: "text-green-600 dark:text-green-400",  bg: "bg-green-50 dark:bg-green-900/20"  },
        ].map(({ icon: Icon, value, label, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl px-3 py-2.5 flex items-center gap-2`}>
            <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
            <div>
              <p className={`text-lg font-black tabular-nums leading-none ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main grid: tree + panel ── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 items-start">

        {/* Tree */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 space-y-0.5">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3 ml-2">
            Click any concept to see its explanation
          </p>
          <TreeNode
            node={mindmap.root}
            depth={0}
            onSelect={setSelectedNode}
            selectedId={selectedNode?.id || null}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
            searchQuery={searchQuery}
          />

          {/* No results */}
          {searchQuery && !matchesSearch(mindmap.root, searchQuery) && (
            <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              No concepts match "{searchQuery}"
            </div>
          )}
        </div>

        {/* Explanation panel */}
        <div className="sticky top-20 space-y-3">
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div
                key={selectedNode.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">
                      {selectedNode.label}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Explanation */}
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {selectedNode.explanation || "Click any node in the map to see its explanation here."}
                </p>

                {/* Sub-topics chips */}
                {selectedNode.children.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                      Sub-topics ({selectedNode.children.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNode.children.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedNode(c);
                            setExpandedIds(prev => new Set([...prev, selectedNode.id, c.id]));
                          }}
                          className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 transition-colors text-left"
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 text-center"
              >
                <Network className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Click any concept to see its explanation
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Depth legend */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Legend</p>
            <div className="space-y-1.5">
              {[
                { pill: "bg-green-600",  label: "Chapter Root"  },
                { pill: "bg-blue-500",   label: "Main Topics"   },
                { pill: "bg-purple-500", label: "Sub-topics"    },
                { pill: "bg-orange-400", label: "Key Details"   },
              ].map(({ pill, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${pill}`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
