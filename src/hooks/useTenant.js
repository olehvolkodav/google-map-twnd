import React, { useState, useEffect, useMemo } from 'react';
import { useFirestore, useFirestoreCollectionData } from 'reactfire';
import { collection, query, where } from 'firebase/firestore';

export default function useTenant() {
  const [tenant, setTenant] = useState(null);

  const firestore = useFirestore();

  const tenantId = useMemo(() => {
    const queryString = window.location.search;
    const params = new URLSearchParams(queryString);
    return params.get('tenantId') || 'swisscom';
  }, []);

  const tenantsCol = collection(firestore, 'tenants');
  const tenantsQuery = query(tenantsCol, where('subdomain', '==', tenantId));
  const { status: tenantStatus, data: tenants } = useFirestoreCollectionData(
    tenantsQuery,
    {
      idField: 'id',
    },
  );

  useEffect(() => setTenant(tenants?.[0] || {}), [setTenant, tenants]);

  return [tenant, tenantStatus];
}
