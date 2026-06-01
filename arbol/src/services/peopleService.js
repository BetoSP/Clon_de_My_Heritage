import { supabase } from "../lib/supabase";

export async function fetchPeople() {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;
  return data;
}

export async function addPerson({
  name, surnames, surname_1, surname_2, surname_married, prefix, suffix,
  birth_day, birth_month, birth_year, birth_place,
  gender, adopted,
  is_alive,
  death_day, death_month, death_year, death_place, death_cause, burial_place,
}) {
  const { data, error } = await supabase
    .from("people")
    .insert([{
      name, surnames, surname_1, surname_2, surname_married, prefix, suffix,
      birth_day, birth_month, birth_year, birth_place,
      gender, adopted,
      is_alive,
      death_day, death_month, death_year, death_place, death_cause, burial_place,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePerson({
  id,
  name, surnames, surname_1, surname_2, surname_married, prefix, suffix,
  birth_day, birth_month, birth_year, birth_place,
  gender, adopted,
  is_alive,
  death_day, death_month, death_year, death_place, death_cause, burial_place,
}) {
  const { error } = await supabase
    .from("people")
    .update({
      name, surnames, surname_1, surname_2, surname_married, prefix, suffix,
      birth_day, birth_month, birth_year, birth_place,
      gender, adopted,
      is_alive,
      death_day, death_month, death_year, death_place, death_cause, burial_place,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function deletePerson(id) {
  const { error } = await supabase
    .from("people")
    .delete()
    .eq("id", id);

  if (error) throw error;
}