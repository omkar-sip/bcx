import * as XLSX from 'xlsx';
import * as fs from 'fs';

const files = [
    'd:/VDIT Winning Project/bcx/public/home_data_sample/add_vehicle.xlsx',
    'd:/VDIT Winning Project/bcx/public/home_data_sample/electricity_dataset.xlsx',
    'd:/VDIT Winning Project/bcx/public/home_data_sample/employee_commute_dataset (1).xlsx',
    'd:/VDIT Winning Project/bcx/public/home_data_sample/fuel_combustion_dataset.xlsx'
];

files.forEach(file => {
    const buf = fs.readFileSync(file);
    const wb = XLSX.read(buf, { type: 'buffer' });
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 })[0];
    console.log(`File: ${file}`);
    console.log(`Headers: ${JSON.stringify(data)}`);
    console.log('---');
});
