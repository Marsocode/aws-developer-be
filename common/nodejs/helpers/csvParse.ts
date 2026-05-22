import csv from 'csv-parser';

export const parseCsvStream = async (stream: NodeJS.ReadableStream): Promise<Record<string, string>[]> => {
  const records: Record<string, string>[] = [];

  await new Promise<void>((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (data) => {
        console.log('CSV record:', data);
        records.push(data);
      })
      .on('end', () => {
        console.log('CSV parsing finished');
        resolve();
      })
      .on('error', reject);
  });

  return records;
};
