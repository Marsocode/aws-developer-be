import csv from 'csv-parser';

export const parseCsvStream = async (stream: NodeJS.ReadableStream): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (data) => {
        console.log('CSV record:', data);
      })
      .on('end', () => {
        console.log('CSV parsing finished');
        resolve();
      })
      .on('error', reject);
  });
};
