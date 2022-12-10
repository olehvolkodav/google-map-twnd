const dayjs = require('dayjs');
const axios = require('axios');
const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();

// function to fetch post endpoint with axios
async function fetchTimeSeriesAggregation(assetId) {
  const startDate = dayjs().startOf('week').toISOString();
  const endDate = dayjs().subtract('4', 'weeks').startOf('week').toISOString();

  const aggregationResp = await axios({
    method: 'post',
    url: `https://api.akenza.io/v3/devices/${assetId}/query/time-series/aggregation`,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'b14fc8daa4ff945d.21df178b-8bf7-4854-98a0-63175e4ff787',
    },
    data: {
      data: {
        key: 'peopleIn',
        topic: 'peopleIn',
      },
      timestamp: {
        from: endDate,
        to: startDate,
      },
      bucket: {
        interval: 'PT1H',
        aggregation: 'AVG',
      },
    },
  });
  return aggregationResp.data.data;
}

async function aggregatePopularTimes(location, disableUpdate) {
  try {
    const assetId = '02b274497569173f' || location.assetId;

    const data = await fetchTimeSeriesAggregation(assetId);

    const dayHourMap = {};
    data.timestamps.forEach((timestampItr, timestampIdx) => {
      const occupancyData = data?.dataPoints?.[timestampIdx] || null;
      if (occupancyData === undefined || occupancyData === null) {
        return;
      }

      const date = dayjs(timestampItr);
      if (!dayHourMap[date.day()]) {
        const dayTemplate = {};
        Array(24)
          .fill(0)
          .forEach((_, hourItr) => (dayTemplate[hourItr] = []));
        dayHourMap[date.day()] = dayTemplate;
      }

      dayHourMap[date.day()][date.hour()].push(
        data?.dataPoints?.[timestampIdx],
      );
    });

    const chartData = [];

    Object.keys(dayHourMap).forEach((dayItr) => {
      const dayData = dayHourMap[dayItr];
      Object.keys(dayData).forEach((hourItr) => {
        const hourData = dayData[hourItr] || [];
        const avgOccupancy =
          hourData.reduce((a, b) => a + b, 0) / hourData.length;

        chartData.push({
          day: parseInt(dayItr, 10),
          hour: parseInt(hourItr, 10),
          occupancy: avgOccupancy || 0,
        });
      });
    });

    if (disableUpdate) {
      return chartData;
    }

    return db.collection('locations').doc(location.id).update({
      popularTimes: chartData,
      updatedAt: new Date(),
      popularTimesUpdatedAt: new Date(),
    });
  } catch (err) {
    console.log('Error in aggregatePopularTimes', location?.assetId, err);
    return false;
  }
}

module.exports = aggregatePopularTimes;
