/**
 * remark-responsive-tables.mjs
 * Remark 插件：自动在 Markdown 表格外套一层 .table-scroll-wrapper
 * 保持语义 HTML，在移动端通过 CSS overflow-x: auto 实现滚动
 *
 * 使用手动遍历（与 remark-rewrite-local-assets 一致），避免依赖 unist-util-visit
 */

export function remarkResponsiveTables() {
  return function transformer(tree) {
    /** @type {{ parent: any, index: number }[]} */
    const tables = [];

    // 收集所有 table 节点及其父节点、位置
    const stack = [{ node: tree, parent: null, index: -1 }];
    while (stack.length) {
      const { node, parent, index } = stack.pop();
      if (!node || typeof node !== 'object') continue;

      if (node.type === 'table' && parent) {
        tables.push({ parent, index });
      }

      const children = node.children;
      if (Array.isArray(children)) {
        for (let i = children.length - 1; i >= 0; i--) {
          stack.push({ node: children[i], parent: node, index: i });
        }
      }
    }

    // 从后往前处理（避免 splice 导致索引偏移）
    tables.sort((a, b) => b.index - a.index);

    for (const { parent, index } of tables) {
      const tableNode = parent.children[index];
      const opener = { type: 'html', value: '<div class="table-scroll-wrapper">' };
      const closer = { type: 'html', value: '</div>' };
      parent.children.splice(index, 1, opener, tableNode, closer);
    }
  };
}
