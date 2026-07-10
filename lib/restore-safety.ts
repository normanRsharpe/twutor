export type DatabaseIdentity = {
  systemIdentifier: string;
  database: string;
};

export function formatDatabaseIdentity(identity: DatabaseIdentity) {
  return `${identity.systemIdentifier}:${identity.database}`;
}

export function assertRestoreTargetIsSafe(source: DatabaseIdentity, target: DatabaseIdentity, approvedTarget: string | undefined) {
  const sourceIdentity = formatDatabaseIdentity(source);
  const targetIdentity = formatDatabaseIdentity(target);

  if (sourceIdentity === targetIdentity) throw new Error("source and restore target are the same database");
  if (!approvedTarget || approvedTarget !== targetIdentity) throw new Error("approved restore target does not match the canonical target identity");
}
