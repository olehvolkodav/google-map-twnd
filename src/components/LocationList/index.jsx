import React from 'react';

import LocationListItem from '../LocationListItem';

function LocationList({ locations }) {
  return (
    <div className="pt-6 pb-48 flex flex-1 flex-col bg-gray-100 px-4 space-y-3 overflow-y-auto">
      {locations.map((item) => (
        <LocationListItem key={item.id} location={item} />
      ))}
    </div>
  );
}

export default LocationList;
