"use client";

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

const STORAGE_KEY = "cheela.dashboard.projects.v1";

export type Project = {
	id: string;
	name: string;
	createdAt: string;
};

type ProjectsState = {
	projects: Project[];
	selectedProjectId: string;
	runtimeProjectMap: Record<string, string>;
};

type ProjectsContextValue = {
	projects: Project[];
	selectedProjectId: string;
	selectedProject: Project;
	runtimeProjectMap: Record<string, string>;
	selectProject: (projectId: string) => void;
	createProject: (name: string) => Project;
	assignRuntime: (runtimeId: string, projectId: string) => void;
	projectRuntimes: (projectId: string) => string[];
};

function createId() {
	return `proj_${Math.random().toString(36).slice(2, 10)}`;
}

function defaultState(): ProjectsState {
	const project: Project = {
		id: createId(),
		name: "My Project",
		createdAt: new Date().toISOString(),
	};
	return {
		projects: [project],
		selectedProjectId: project.id,
		runtimeProjectMap: {},
	};
}

function loadState(): ProjectsState {
	if (typeof window === "undefined") return defaultState();
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return defaultState();
		const parsed = JSON.parse(raw) as ProjectsState;
		if (!parsed.projects?.length || !parsed.selectedProjectId) {
			return defaultState();
		}
		return {
			projects: parsed.projects,
			selectedProjectId: parsed.selectedProjectId,
			runtimeProjectMap: parsed.runtimeProjectMap ?? {},
		};
	} catch {
		return defaultState();
	}
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<ProjectsState>(defaultState);
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setState(loadState());
		setHydrated(true);
	}, []);

	useEffect(() => {
		if (!hydrated) return;
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	}, [state, hydrated]);

	const selectProject = useCallback((projectId: string) => {
		setState((current) => {
			if (!current.projects.some((project) => project.id === projectId)) {
				return current;
			}
			return { ...current, selectedProjectId: projectId };
		});
	}, []);

	const createProject = useCallback((name: string) => {
		const trimmed = name.trim() || "Untitled Project";
		const project: Project = {
			id: createId(),
			name: trimmed,
			createdAt: new Date().toISOString(),
		};
		setState((current) => ({
			...current,
			projects: [...current.projects, project],
			selectedProjectId: project.id,
		}));
		return project;
	}, []);

	const assignRuntime = useCallback((runtimeId: string, projectId: string) => {
		setState((current) => ({
			...current,
			runtimeProjectMap: {
				...current.runtimeProjectMap,
				[runtimeId]: projectId,
			},
		}));
	}, []);

	const projectRuntimes = useCallback(
		(projectId: string) =>
			Object.entries(state.runtimeProjectMap)
				.filter(([, mapped]) => mapped === projectId)
				.map(([runtimeId]) => runtimeId),
		[state.runtimeProjectMap],
	);

	const selectedProject =
		state.projects.find((project) => project.id === state.selectedProjectId) ??
		state.projects[0] ??
		defaultState().projects[0];

	const value = useMemo<ProjectsContextValue>(
		() => ({
			projects: state.projects,
			selectedProjectId: selectedProject.id,
			selectedProject,
			runtimeProjectMap: state.runtimeProjectMap,
			selectProject,
			createProject,
			assignRuntime,
			projectRuntimes,
		}),
		[
			state.projects,
			state.runtimeProjectMap,
			selectedProject,
			selectProject,
			createProject,
			assignRuntime,
			projectRuntimes,
		],
	);

	return (
		<ProjectsContext.Provider value={value}>
			{children}
		</ProjectsContext.Provider>
	);
}

export function useProjects(): ProjectsContextValue {
	const value = useContext(ProjectsContext);
	if (!value) {
		throw new Error("useProjects must be used within ProjectsProvider");
	}
	return value;
}
