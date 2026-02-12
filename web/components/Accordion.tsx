'use client';

import React from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { useAccessibility, useFocusTrap } from '../hooks/useAccessibility';

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
  defaultExpanded?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultExpanded?: string[];
  className?: string;
  variant?: 'default' | 'bordered' | 'minimal';
}

export function Accordion({
  items,
  allowMultiple = false,
  defaultExpanded = [],
  className = '',
  variant = 'default',
}: AccordionProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    new Set(defaultExpanded)
  );
  
  const { setAriaExpanded, setAriaSelected, announce } = useAccessibility();

  const handleToggle = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item?.disabled) return;

    setExpandedItems(prev => {
      const newSet = new Set(prev);
      
      if (allowMultiple) {
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
          announce(`${item?.title || 'Item'} collapsed`, 'polite');
        } else {
          newSet.add(itemId);
          announce(`${item?.title || 'Item'} expanded`, 'polite');
        }
      } else {
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
          announce(`${item?.title || 'Item'} collapsed`, 'polite');
        } else {
          newSet.clear();
          newSet.add(itemId);
          announce(`${item?.title || 'Item'} expanded`, 'polite');
        }
      }
      
      return newSet;
    });
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'bordered':
        return 'border border-slate-700 divide-y divide-slate-700';
      case 'minimal':
        return 'space-y-2';
      default:
        return 'bg-slate-800/50 border border-slate-700 divide-y divide-slate-700';
    }
  };

  const getButtonClasses = (item: AccordionItem, isExpanded: boolean) => {
    const baseClasses = 'w-full flex items-center justify-between p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500';
    
    if (item.disabled) {
      return `${baseClasses} text-slate-500 cursor-not-allowed`;
    }
    
    if (variant === 'minimal') {
      return `${baseClasses} hover:bg-slate-800 ${isExpanded ? 'text-blue-400' : 'text-white'}`;
    }
    
    return `${baseClasses} hover:bg-slate-700 ${isExpanded ? 'text-blue-400 bg-slate-700' : 'text-white'}`;
  };

  return (
    <div className={`rounded-lg overflow-hidden ${getVariantClasses()} ${className}`}>
      {items.map(item => {
        const isExpanded = expandedItems.has(item.id);
        
        return (
          <AccordionItemComponent
            key={item.id}
            item={item}
            isExpanded={isExpanded}
            onToggle={() => handleToggle(item.id)}
            variant={variant}
          />
        );
      })}
    </div>
  );
}

// Individual accordion item component
function AccordionItemComponent({
  item,
  isExpanded,
  onToggle,
  variant,
}: {
  item: AccordionItem;
  isExpanded: boolean;
  onToggle: () => void;
  variant: string;
}) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const { setAriaExpanded, setAriaControls } = useAccessibility();

  // Update ARIA attributes
  React.useEffect(() => {
    const button = document.getElementById(`accordion-button-${item.id}`);
    const content = contentRef.current;
    
    if (button) {
      setAriaExpanded(button, isExpanded);
      if (content) {
        setAriaControls(button, `accordion-content-${item.id}`);
      }
    }
  }, [isExpanded, item.id, setAriaExpanded, setAriaControls]);

  const getButtonClasses = () => {
    const baseClasses = 'w-full flex items-center justify-between p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500';
    
    if (item.disabled) {
      return `${baseClasses} text-slate-500 cursor-not-allowed`;
    }
    
    if (variant === 'minimal') {
      return `${baseClasses} hover:bg-slate-800 ${isExpanded ? 'text-blue-400' : 'text-white'}`;
    }
    
    return `${baseClasses} hover:bg-slate-700 ${isExpanded ? 'text-blue-400 bg-slate-700' : 'text-white'}`;
  };

  const getHeight = () => {
    if (!contentRef.current || !isExpanded) return 0;
    return contentRef.current.scrollHeight;
  };

  return (
    <div className={`accordion-item ${item.disabled ? 'opacity-50' : ''}`}>
      <button
        id={`accordion-button-${item.id}`}
        onClick={onToggle}
        disabled={item.disabled}
        className={getButtonClasses()}
        aria-expanded={isExpanded}
        aria-controls={`accordion-content-${item.id}`}
        type="button"
      >
        <span className="font-medium">{item.title}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      
      <div
        id={`accordion-content-${item.id}`}
        ref={contentRef}
        className="overflow-hidden transition-all duration-300"
        style={{ height: `${getHeight()}px` }}
        role="region"
        aria-labelledby={`accordion-button-${item.id}`}
      >
        <div className="p-4 pt-0 text-slate-300">
          {item.content}
        </div>
      </div>
    </div>
  );
}

// Tree view component for hierarchical navigation
export function TreeView({
  items,
  onSelect,
  selectedIds,
  multiSelect = false,
  className = '',
}: {
  items: TreeNode[];
  onSelect?: (selectedIds: string[]) => void;
  selectedIds?: string[];
  multiSelect?: boolean;
  className?: string;
}) {
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(new Set());
  const [selectedNodes, setSelectedNodes] = React.useState<Set<string>>(
    new Set(selectedIds || [])
  );
  
  const { announce } = useAccessibility();

  const handleToggle = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleSelect = (nodeId: string, event: React.MouseEvent) => {
    event.preventDefault();
    
    let newSelection: Set<string>;
    
    if (multiSelect && event.ctrlKey) {
      newSelection = new Set(selectedNodes);
      if (newSelection.has(nodeId)) {
        newSelection.delete(nodeId);
      } else {
        newSelection.add(nodeId);
      }
    } else if (multiSelect && event.shiftKey && selectedNodes.size > 0) {
      // Range selection (simplified)
      newSelection = new Set([nodeId]);
    } else {
      newSelection = new Set([nodeId]);
    }
    
    setSelectedNodes(newSelection);
    onSelect?.(Array.from(newSelection));
    
    announce(`Selected ${newSelection.size} items`, 'polite');
  };

  return (
    <div className={`space-y-1 ${className}`} role="tree">
      {items.map(item => (
        <TreeNodeComponent
          key={item.id}
          item={item}
          expandedNodes={expandedNodes}
          selectedNodes={selectedNodes}
          onToggle={handleToggle}
          onSelect={handleSelect}
          level={0}
        />
      ))}
    </div>
  );
}

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  icon?: React.ReactNode;
  disabled?: boolean;
}

function TreeNodeComponent({
  item,
  expandedNodes,
  selectedNodes,
  onToggle,
  onSelect,
  level,
}: {
  item: TreeNode;
  expandedNodes: Set<string>;
  selectedNodes: Set<string>;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string, event: React.MouseEvent) => void;
  level: number;
}) {
  const isExpanded = expandedNodes.has(item.id);
  const isSelected = selectedNodes.has(item.id);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div role="treeitem" aria-expanded={isExpanded} aria-level={level + 1}>
      <div
        className={`flex items-center py-1 px-2 rounded cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-600/20 text-blue-400'
            : 'hover:bg-slate-700 text-slate-300'
        } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ paddingLeft: `${level * 20}px` }}
        onClick={(e) => !item.disabled && onSelect(item.id, e)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(item.id);
            }}
            className="p-1 hover:bg-slate-600 rounded"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        )}
        
        {item.icon && (
          <span className="mr-2">{item.icon}</span>
        )}
        
        <span className="flex-1">{item.label}</span>
        
        {isSelected && (
          <Check className="w-3 h-3 text-blue-400" />
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div className="ml-2">
          {item.children!.map(child => (
            <TreeNodeComponent
              key={child.id}
              item={child}
              expandedNodes={expandedNodes}
              selectedNodes={selectedNodes}
              onToggle={onToggle}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}