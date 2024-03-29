const dayjs = require('dayjs');
const imageUrlBuilder = require('@sanity/image-url');
const { getFirestore } = require('firebase-admin/firestore');
const sanityClient = require('@sanity/client')({
  projectId: '9cb050q1',
  dataset: 'production',
  apiVersion: '2022-11-29',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

const aggregatePopularTimes = require('../helpers/aggregatePopularTimes');

const db = getFirestore();

const imageUrlBuilderClient = imageUrlBuilder({
  projectId: '9cb050q1',
  dataset: 'production',
});

async function onLocationUpdate(data) {
  let imageUrl = undefined;
  if (data?.image) {
    imageUrl = imageUrlBuilderClient.image(data?.image).format('webp').url();
  }

  const updateData = {
    id: data?._id,
    title: data?.name,
    description: data?.description,
    spaceId: data?.spaceId,
    assetId: data?.assetId,
    location: {
      streetName: data?.address?.streetName,
      zipCode: data?.address?.zipCode,
      city: data?.address?.city,
      mapsLink: data?.address?.mapsLink,
      geopoint: {
        lat: data?.address?.location?.lat,
        long: data?.address?.location?.lng,
      },
    },
    imageUrl,
    updatedAt: new Date(),
  };

  const locationSnap = await db.collection('locations').doc(data?._id).get();

  // create location if it does not exist
  if (!locationSnap.exists) {
    updateData.createdAt = new Date();
    updateData.absoluteOccupancy = 0;
    updateData.relativeOccupancy = 0;

    let popularTimes = [];
    try {
      popularTimes = await aggregatePopularTimes(updateData, true);
    } catch (err) {
      console.log('err calculating popular times', err);
    }
    updateData.popularTimes = popularTimes;

    return db.collection('locations').doc(data?._id).set(updateData);
  }

  // update existing location
  return db.collection('locations').doc(data?._id).update(updateData);
}

async function onLocationTenantUpdate(tenant, location) {
  const locationRef = await db.collection('locations').doc(location?._ref);
  const locationSnapshot = await locationRef.get();
  if (!locationSnapshot.exists) {
    return;
  }

  await locationRef.set(
    {
      tenantId: tenant?._id,
    },
    { merge: true },
  );
}

async function onTenantUpdate(data) {
  let logoUrl = undefined;
  if (data?.branding?.logo) {
    logoUrl = imageUrlBuilderClient.image(data?.branding?.logo).url();
  }

  const tenantDoc = await db.collection('tenants').doc(data?._id);
  await tenantDoc.set(
    {
      id: data?._id,
      createdAt: new Date(data?._createdAt),
      updatedAt: new Date(),
      companyName: data?.companyName,
      locations: data?.locations?.map((location) => location?._ref),
      subdomain: data?.subdomain?.current,
      branding: {
        logoUrl,
        productName: data?.branding?.productName,
        primaryColor: data?.branding?.primaryColor?.hex,
        secondaryColor: data?.branding?.secondaryColor?.hex,
        headerBackgroundColor: data?.branding?.headerBackgroundColor?.hex,
      },
    },
    { merge: true },
  );

  // update the tenantId of the location document
  const updateLocationTenantsPromises =
    data?.locations?.map((locationItr) =>
      onLocationTenantUpdate(data, locationItr),
    ) || [];
  await Promise.all(updateLocationTenantsPromises);
}

async function onTranslationUpdate(data) {
  const translationDoc = await db.collection('translations').doc(data?._id);
  return translationDoc.set(
    {
      id: data?._id,
      createdAt: new Date(data?._createdAt),
      updatedAt: new Date(),
      key: data?.key?.current,
      text: data?.text,
    },
    { merge: true },
  );
}

async function onSanityCreateUpdate(req, res) {
  try {
    const data = req?.body || {};
    if (data?._type === 'location') {
      await onLocationUpdate(data);
    }
    if (data?._type === 'tenant') {
      await onTenantUpdate(data);
    }
    if (data?._type === 'translation') {
      await onTranslationUpdate(data);
    }

    res.status(204).send();
  } catch (err) {
    console.log(err);
    res.status(500).json({
      errorCode: '6d3ed0cf-332f-4242-b730-34933aa1ab13',
      error: err.toString(),
    });
  }
}

module.exports.onSanityCreateUpdate = onSanityCreateUpdate;

async function onSanityDelete(req, res) {
  try {
    const data = req?.body || {};
    switch (data?._type) {
      case 'location':
        await db.collection('locations').doc(data?._id).delete();
        break;
      case 'tenant':
        await db.collection('tenants').doc(data?._id).delete();
        break;
      case 'translation':
        await db.collection('translations').doc(data?._id).delete();
        break;
      default:
        res.status(500).json({
          errorCode: 'e2597ab7-641c-4448-a70f-8781a027325b',
          error: 'unsupported document type',
        });
        break;
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({
      errorCode: 'c78f3b15-7a74-4360-ab62-079d45b5673b',
      error: err.toString(),
    });
  }
}

module.exports.onSanityDelete = onSanityDelete;

async function onSanityReconciliation(req, res) {
  const sanityLocations = await sanityClient.fetch('*[_type == "location"]');
  const updateLocationPromises = sanityLocations.map((locationItr) =>
    onLocationUpdate(locationItr),
  );

  const sanityTenants = await sanityClient.fetch('*[_type == "tenant"]');
  const updateTenantPromises = sanityTenants.map((tenantItr) =>
    onTenantUpdate(tenantItr),
  );

  const sanityTranslation = await sanityClient.fetch(
    '*[_type == "translation"]',
  );
  const updateTranslationPromises = sanityTranslation.map((translationItr) =>
    onTranslationUpdate(translationItr),
  );

  await Promise.all(updateLocationPromises);
  await Promise.all(updateTenantPromises);
  await Promise.all(updateTranslationPromises);

  res.status(204).send();
}

module.exports.onSanityReconciliation = onSanityReconciliation;

async function onAggregatePopularTimes(req, res) {
  const now = dayjs();

  const isForceUpdate = req.query.force === 'true';

  const locationDocs = await db.collection('locations').get();
  const updatePopularTimesPromises = locationDocs.docs
    .map((doc) => doc.data())
    .filter((locationItr) => {
      const lastUpdatedAt = dayjs(locationItr?.updatedAt);
      return isForceUpdate || now.diff(lastUpdatedAt, 'days') > 6;
    })
    .map((locationItr) => aggregatePopularTimes(locationItr));

  await Promise.all(updatePopularTimesPromises);

  res.status(200).send({
    message: `updated popular times for ${updatePopularTimesPromises.length} locations`,
  });
}

module.exports.onAggregatePopularTimes = onAggregatePopularTimes;
