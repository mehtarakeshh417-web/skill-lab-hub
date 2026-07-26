export type ProjectFile = { name: string; path: string };
export type SignedProjectFile = ProjectFile & { url: string | null };