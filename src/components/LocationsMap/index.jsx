import React, { useMemo, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';

import { ReactComponent as IconMarker } from '../../assets/images/marker.svg';
import { ReactComponent as IconMarkerSelected } from '../../assets/images/marker-selected.svg';
import { closeLocation, openLocation } from '../../features/home/homeSlice';

import Header from '../Header';
import DetailPopup from '../DetailPopup';
import DetailModal from '../DetailModal';
import DetailBottomSheet from '../DetailBottomSheet';

import './index.pcss';

function LocationsMap({ locations }) {
  const dispatch = useDispatch();
  const { selectedLocation, isMobile } = useSelector((state) => state.home);
  const isListView = useSelector((state) => state.home.view === 'list');

  const mapRef = useRef();
  useEffect(() => {
    mapRef?.current?.resize();
  }, [isListView, mapRef]);

  const locationMarkers = useMemo(
    () =>
      locations?.map((locationItr, index) => {
        const isSelected = selectedLocation?.id === locationItr.id;
        let markerClass = 'yc-map__marker--occupancy-low';
        if (locationItr?.relativeOccupancy >= 100) {
          markerClass = 'yc-map__marker--occupancy-full';
        } else if (locationItr?.relativeOccupancy >= 85) {
          markerClass = 'yc-map__marker--occupancy-medium';
        }

        return (
          <Marker
            key={`marker-${index}`}
            longitude={locationItr.location.geopoint.long}
            latitude={locationItr.location.geopoint.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              dispatch(openLocation(locationItr, 'marker'));
            }}
          >
            {!isSelected && (
              <div className={`yc-map__marker ${markerClass}`}>
                <IconMarker />
              </div>
            )}
            {isSelected && <IconMarkerSelected />}
          </Marker>
        );
      }),
    [dispatch, selectedLocation, locations],
  );

  const [viewState, setViewState] = React.useState({
    latitude: 46.9502655,
    longitude: 7.4410446,
    zoom: 12,
    bearing: 0,
    pitch: 0,
  });

  useEffect(() => {
    if (!selectedLocation) return;

    setViewState({
      ...viewState,
      latitude: selectedLocation.location.geopoint.lat,
      longitude: selectedLocation.location.geopoint.long,
    });
  }, [selectedLocation]);

  return (
    <>
      <div className={classNames(isListView ? 'hidden md:block' : 'block')}>
        <div className="md:hidden">
          <Header />
        </div>
        <div className="relative">
          <div
            className={classNames(
              'yc-map__container w-screen',
              isMobile ? 'h-[calc(100vh-100px)]' : 'h-screen',
            )}
          >
            <Map
              ref={mapRef}
              reuseMaps
              {...viewState}
              onMove={(evt) => setViewState(evt.viewState)}
              mapStyle="mapbox://styles/mapbox/streets-v11"
              mapboxAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
              dragPan
            >
              {!isMobile && <NavigationControl position="bottom-right" />}
              {locationMarkers}
              {!isMobile && selectedLocation && (
                <Popup
                  anchor="left"
                  longitude={Number(selectedLocation.location.geopoint.long)}
                  latitude={Number(selectedLocation.location.geopoint.lat)}
                  closeButton={false}
                  className="yc-map__popup"
                  onClose={() => dispatch(closeLocation())}
                >
                  <DetailPopup onClose={() => dispatch(closeLocation())} />
                </Popup>
              )}
              {isMobile && <DetailBottomSheet />}
            </Map>
          </div>
        </div>
      </div>
      {isMobile && selectedLocation && <DetailModal />}
    </>
  );
}

export default LocationsMap;
