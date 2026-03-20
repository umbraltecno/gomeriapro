//require('dotenv').config(); // ¡Esto es vital en Node.js!
//import { createClient } from '@supabase/supabase-js'

// Cambia process.env por import.meta.env
//const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
//const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

//if (!supabaseUrl || !supabaseAnonKey) {
//  console.error("Faltan las variables de entorno de Supabase. Revisa tu archivo .env");
//}

//export const supabase = createClient(supabaseUrl, supabaseAnonKey)
// Usa require para dotenv en Node.js
require('dotenv').config(); 
const { createClient } = require('@supabase/supabase-js');

// En Node.js se usa EXCLUSIVAMENTE process.env
//const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
//const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
console.log("URL:", import.meta.env.VITE_SUPABASE_URL); // ¿Sale la URL o sale undefined?
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: No se pudieron cargar las variables de entorno.");
  console.log("Revisando process.env.VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL);
}
console.log("Intentando conectar a:", import.meta.env.VITE_SUPABASE_URL);

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.error("¡ERROR! La URL de Supabase es undefined. Revisa tu archivo .env.local");
}
export const supabase = createClient(supabaseUrl, supabaseKey);
