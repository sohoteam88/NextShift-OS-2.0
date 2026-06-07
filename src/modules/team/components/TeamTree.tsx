'use client';

import * as React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { TeamMemberNode } from '../types';
import { TeamMemberCard } from './TeamMemberCard';

type Props = {
  root: TeamMemberNode;
  layout: 'vertical' | 'horizontal';
  largeTeam?: boolean;
  selectedId?: string | null;
  onSelect: (member: TeamMemberNode) => void;
};

function collectExpandedIds(node: TeamMemberNode, includeAll: boolean, ids = new Set<string>()) {
  if (!includeAll) {
    ids.add(node.id);
    return ids;
  }

  ids.add(node.id);
  for (const child of node.children) {
    collectExpandedIds(child, includeAll, ids);
  }
  return ids;
}

type NodeProps = {
  node: TeamMemberNode;
  layout: 'vertical' | 'horizontal';
  expandedIds: Set<string>;
  setExpandedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedId?: string | null;
  onSelect: (member: TeamMemberNode) => void;
  depth?: number;
};

function TreeNode({
  node,
  layout,
  expandedIds,
  setExpandedIds,
  selectedId,
  onSelect,
  depth = 0,
}: NodeProps) {
  const t = useTranslations('team');
  const hasChildren = node.children.length > 0;
  const expanded = expandedIds.has(node.id);
  const phone = node.phone;

  const toggleExpanded = () => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(node.id)) next.delete(node.id);
      else next.add(node.id);
      return next;
    });
  };

  return (
    <div className={cn('flex min-w-0 flex-col items-center', depth === 0 ? 'w-full' : 'shrink-0')}>
      <div className="relative w-full max-w-full sm:max-w-[420px]">
        <div
          className="cursor-pointer"
          onClick={() => onSelect(node)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelect(node);
            }
          }}
        >
          <TeamMemberCard
            member={node}
            compact={depth > 0}
            selected={selectedId === node.id}
            onViewDetails={() => onSelect(node)}
            onSendMessage={
              phone
                ? () => window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer')
                : undefined
            }
          />
        </div>

        {hasChildren && (
          <Button
            className="absolute -right-2 -top-2 h-8 w-8 rounded-full p-0"
            size="sm"
            variant={expanded ? 'primary' : 'secondary'}
            icon={expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            onClick={(event) => {
              event.stopPropagation();
              toggleExpanded();
            }}
            aria-label={expanded ? t('collapse') : t('expand')}
          />
        )}
      </div>

      {hasChildren && expanded && (
        <div
          className={cn(
            'mt-4 flex w-full gap-4',
            layout === 'horizontal'
              ? 'flex-col md:flex-row md:flex-wrap md:justify-center md:overflow-x-auto md:pb-2'
              : 'flex-col items-stretch pl-4',
          )}
        >
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              layout={layout}
              expandedIds={expandedIds}
              setExpandedIds={setExpandedIds}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TeamTree({ root, layout, largeTeam = false, selectedId, onSelect }: Props) {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => collectExpandedIds(root, !largeTeam));

  React.useEffect(() => {
    setExpandedIds(collectExpandedIds(root, !largeTeam));
  }, [root, largeTeam]);

  return (
    <div className={cn('overflow-x-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm md:overflow-x-auto')}>
      <div className={cn('min-w-full', layout === 'horizontal' ? 'flex justify-center' : '')}>
        <TreeNode
          node={root}
          layout={layout}
          expandedIds={expandedIds}
          setExpandedIds={setExpandedIds}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={0}
        />
      </div>
    </div>
  );
}
