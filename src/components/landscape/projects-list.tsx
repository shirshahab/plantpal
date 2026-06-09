"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, FolderOpen, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LandscapeProject } from "@/lib/landscape/types";
import { SPACE_TYPE_LABELS, STYLE_GOAL_LABELS } from "@/lib/landscape/types";

interface ProjectsListProps {
  projects: LandscapeProject[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectsList({ projects, onOpen, onDelete }: ProjectsListProps) {
  if (projects.length === 0) {
    return (
      <Card padding="md" className="text-center">
        <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="font-medium text-gray-900">No saved projects yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Analyze a space and save inspiration, photos, plant lists, and budget estimates.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <Card key={project.id} padding="none" className="overflow-hidden">
          <div className="flex gap-0">
            <button
              type="button"
              onClick={() => onOpen(project.id)}
              className="flex flex-1 items-center gap-3 p-3 text-left hover:bg-green-50/50 transition-colors touch-manipulation min-w-0"
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                {project.photoDataUrl ? (
                  <Image
                    src={project.photoDataUrl}
                    alt={project.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">
                    🌿
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{project.name}</p>
                <p className="text-xs text-gray-500">
                  {SPACE_TYPE_LABELS[project.spaceType]} · {STYLE_GOAL_LABELS[project.styleGoal]} · ZIP {project.zipCode}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(project.updatedAt).toLocaleDateString()}
                  {project.visualConceptRequested && " · Visual concept queued"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 self-center mr-2 text-gray-400 hover:text-red-600"
              onClick={() => onDelete(project.id)}
              aria-label={`Delete ${project.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

interface ProjectsListHeaderProps {
  count: number;
}

export function ProjectsListHeader({ count }: ProjectsListHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-gray-900">
        Landscape projects {count > 0 && `(${count})`}
      </p>
      <Link href="/property" className="text-xs text-green-600 hover:underline">
        Property mode
      </Link>
    </div>
  );
}
