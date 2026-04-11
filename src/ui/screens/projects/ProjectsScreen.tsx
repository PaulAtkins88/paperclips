import type { ProjectId, VisibleProject } from '../../../domain/game'
import { CardGrid, SectionCard } from '../../system'
import { ProjectCard } from '../../components/ProjectCard'

interface ProjectsScreenProps {
  activeProjects: VisibleProject[]
  canFundProject: (projectId: ProjectId) => boolean
  onCompleteProject: (projectId: ProjectId) => void
}

export function ProjectsScreen({ activeProjects, canFundProject, onCompleteProject }: ProjectsScreenProps) {
  return (
    <CardGrid>
      {activeProjects.length === 0 ? (
        <SectionCard title="Projects" tooltip="Active projects appear here once their triggers are met." className="md:col-span-2">
          <h3 className="font-display mt-2 text-xl font-semibold text-white">No active projects yet.</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Original projects appear dynamically as their triggers are met. Build clips, fill ops, and keep progressing.
          </p>
        </SectionCard>
      ) : (
        activeProjects.map((project) => (
          <ProjectCard
            key={project.id}
            id={project.id}
            title={project.title}
            description={project.description}
            costs={project.costs}
            completed={project.completed}
            canAfford={canFundProject(project.id)}
            repeatable={project.repeatable}
            onComplete={() => onCompleteProject(project.id)}
          />
        ))
      )}
    </CardGrid>
  )
}
