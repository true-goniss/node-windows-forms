using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Windows.Forms;

namespace NodeWindowsForms.Core
{
    /// <summary>
    /// Node registry and helpers for the TreeView pseudo-method bridge.
    /// TreeNode identity: node.Name holds the generated id (Guid), which is
    /// also the ObjectStore key so setProperty/getProperty work on nodes.
    /// All members run on the UI thread (Dispatcher marshals, binder handlers too).
    /// </summary>
    public static class TreeViewBridge
    {
        private static readonly Dictionary<string, TreeNode> _nodesById = new();
        private static readonly Dictionary<TreeView, HashSet<string>> _idsByTree = new();

        public static TreeNode Resolve(string nodeId)
        {
            return nodeId != null && _nodesById.TryGetValue(nodeId, out var node) ? node : null;
        }

        public static void RegisterNode(TreeView owner, string id, TreeNode node)
        {
            if (!_idsByTree.TryGetValue(owner, out var ids))
            {
                ids = new HashSet<string>();
                _idsByTree[owner] = ids;
                // Nodes are not Controls, so ObjectStore won't purge them on its own
                owner.Disposed += (s, e) => DetachTree(owner);
            }
            ids.Add(id);
            _nodesById[id] = node;
            ObjectStore.Register(id, node);
        }

        public static void DetachTree(TreeView owner)
        {
            if (!_idsByTree.TryGetValue(owner, out var ids)) return;
            foreach (var id in ids)
            {
                _nodesById.Remove(id);
                ObjectStore.Remove(id);
            }
            _idsByTree.Remove(owner);
        }

        /// <summary>
        /// Node descriptor for the wire. Lowercase field names so the shape is
        /// identical in event payloads (CamelCase policy) and return values.
        /// </summary>
        public static object DescribeNode(TreeNode node)
        {
            return new
            {
                id = node.Name,
                text = node.Text,
                tag = node.Tag?.ToString(),
                parentId = node.Parent?.Name,
                level = node.Level,
                isExpanded = node.IsExpanded,
                @checked = node.Checked,
                index = node.Index,
                fullPath = node.FullPath,
                childCount = node.Nodes.Count
            };
        }

        public static string AddNode(TreeView tv, JsonElement spec, string parentId)
        {
            var node = CreateNode(spec);
            TreeNode parent = Resolve(parentId);
            RegisterNode(tv, node.Name, node);
            if (parent != null) parent.Nodes.Add(node); else tv.Nodes.Add(node);
            return node.Name;
        }

        public static string[] AddNodes(TreeView tv, JsonElement nodesEl, string parentId)
        {
            var topLevelIds = new List<string>();
            foreach (var spec in nodesEl.EnumerateArray())
            {
                var node = CreateNode(spec);
                TreeNode parent = Resolve(parentId);
                RegisterNode(tv, node.Name, node);
                if (parent != null) parent.Nodes.Add(node); else tv.Nodes.Add(node);
                topLevelIds.Add(node.Name);
                if (spec.TryGetProperty("nodes", out var children) && children.ValueKind == JsonValueKind.Array)
                {
                    AddChildren(tv, node, children);
                }
            }
            return topLevelIds.ToArray();
        }

        private static void AddChildren(TreeView tv, TreeNode parent, JsonElement nodesEl)
        {
            foreach (var spec in nodesEl.EnumerateArray())
            {
                var node = CreateNode(spec);
                RegisterNode(tv, node.Name, node);
                parent.Nodes.Add(node);
                if (spec.TryGetProperty("nodes", out var children) && children.ValueKind == JsonValueKind.Array)
                {
                    AddChildren(tv, node, children);
                }
            }
        }

        private static TreeNode CreateNode(JsonElement spec)
        {
            string text = spec.GetProperty("text").GetString();
            string tag = null;
            if (spec.TryGetProperty("tag", out var tagEl))
            {
                tag = tagEl.ValueKind == JsonValueKind.String ? tagEl.GetString() : tagEl.ToString();
            }
            return new TreeNode(text)
            {
                Name = Guid.NewGuid().ToString(),
                Tag = tag
            };
        }

        public static void RemoveNode(string nodeId)
        {
            TreeNode node = Resolve(nodeId);
            if (node == null) throw new Exception($"Node {nodeId} not found");
            PurgeSubtree(node);
            node.Remove();
        }

        public static void ClearNodes(TreeView tv)
        {
            DetachTree(tv);
            tv.Nodes.Clear();
        }

        private static void PurgeSubtree(TreeNode node)
        {
            foreach (TreeNode child in node.Nodes)
            {
                PurgeSubtree(child);
            }
            _nodesById.Remove(node.Name);
            ObjectStore.Remove(node.Name);
            if (node.TreeView != null && _idsByTree.TryGetValue(node.TreeView, out var ids))
            {
                ids.Remove(node.Name);
            }
        }
    }
}
