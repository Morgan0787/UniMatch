import { apiClient } from '@/lib/apiClient';
import { supabase } from '@/lib/supabase';

/** Verify the same signed-in owner before every profile operation. */
export function admissionFavoriteRepository(owner) {
  const verifyOwner = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const user = data.session?.user;
    if (user?.id !== owner.id || user?.email !== owner.email) throw new Error('sessionChanged');
  };
  return {
    findProfiles: async email => { await verifyOwner(); return apiClient.entities.StudentProfile.filter({ created_by: email }); },
    createProfile: async row => { await verifyOwner(); return apiClient.entities.StudentProfile.create(row); },
    updateProfile: async (id, row) => { await verifyOwner(); return apiClient.entities.StudentProfile.update(id, row); },
    readProfile: async id => {
      await verifyOwner();
      const rows = await apiClient.entities.StudentProfile.filter({ id });
      if (rows.length !== 1) throw new Error('Your profile could not be confirmed.');
      return rows[0];
    },
  };
}
