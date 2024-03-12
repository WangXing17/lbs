import fs from 'fs';
import path from 'path';

export function GET(request) {
  let usersPath = path.join(process.cwd(), 'users.json');
  let file = fs.readFileSync(usersPath);
  return new Response(file);
}