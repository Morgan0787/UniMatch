import { admissionFavoriteRepository } from './admissions/favoriteRepository';
import { canonicalFavoriteId, serializeFavoriteWrite, writeAdmissionFavorite } from './admissions/favorites';

/** @typedef {{ owner: { id: string, email?: string }, university: { id: string, admissionCatalog?: any }, remove: boolean }} UniversityFavoriteRequest */

async function readOwnedProfiles(owner) {
  const profiles = await admissionFavoriteRepository(owner).findProfiles(owner.email);
  if (profiles.length > 1) throw new Error('Your profile could not be selected safely.');
  return profiles;
}

export function studentProfileQueryOptions(owner) {
  return {
    queryKey: ['studentProfile', owner?.id, owner?.email],
    enabled: Boolean(owner?.id && owner?.email),
    queryFn: () => readOwnedProfiles(owner),
  };
}

async function publishProfile(queryClient, owner, profile) {
  const { queryKey } = studentProfileQueryOptions(owner);
  await queryClient.cancelQueries({ queryKey, exact: true });
  queryClient.setQueryData(queryKey, [profile]);
}

export function saveStudentProfile(queryClient, owner, fields) {
  return serializeFavoriteWrite(owner.id, async () => {
    const [existing] = await readOwnedProfiles(owner);
    const updates = typeof fields === 'function' ? fields(existing) : fields;
    if (existing && Object.keys(updates).length === 0) {
      await publishProfile(queryClient, owner, existing);
      return existing;
    }
    const repository = admissionFavoriteRepository(owner);
    const profile = existing
      ? await repository.updateProfile(existing.id, updates)
      : await repository.createProfile(updates);
    await publishProfile(queryClient, owner, profile);
    return profile;
  });
}

/** Publish the read-back row while holding the same lock used by the writer. */
export function writeConfirmedFavorite(queryClient, owner, institutionId, remove, institutions) {
  return serializeFavoriteWrite(owner.id, async () => {
    const profile = await writeAdmissionFavorite(admissionFavoriteRepository(owner), owner, institutionId, remove, institutions);
    await publishProfile(queryClient, owner, profile);
    return profile;
  });
}

function universityFavoriteIdentity(university) {
  if (!university?.id) return null;
  if (university.admissionCatalog !== undefined) {
    return university.admissionCatalog?.status === 'valid' ? university.admissionCatalog.identity : null;
  }
  return { id: university.id, institutionId: university.id, legacyFavoriteKeys: [] };
}

export function isUniversityFavorite(saved, university) {
  const identity = universityFavoriteIdentity(university);
  return Boolean(identity && Array.isArray(saved)
    && saved.some(value => canonicalFavoriteId(value, [identity]) === identity.institutionId));
}

export async function writeConfirmedUniversityFavorite(queryClient, owner, university, remove) {
  const identity = universityFavoriteIdentity(university);
  if (!identity) throw new Error('The institution does not have a saved-list key.');
  return writeConfirmedFavorite(queryClient, owner, identity.institutionId, remove, [identity]);
}
