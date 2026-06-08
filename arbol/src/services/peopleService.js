import { supabase } from "../lib/supabase";

export async function fetchPeople() {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;
  return data;
}

export async function fetchPeopleByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .in("id", ids);

  if (error) throw error;
  return data;
}

export async function addPerson({
  name, name_2, surnames, surname_1, surname_2, surname_married, prefix, suffix,
  birth_day, birth_month, birth_year, birth_place,
  gender, adopted,
  is_alive,
  death_day, death_month, death_year, death_place, death_cause, burial_place,
  migration_condition,
}) {
  const { data, error } = await supabase
    .from("people")
    .insert([{
      name, name_2, surnames, surname_1, surname_2, surname_married, prefix, suffix,
      birth_day, birth_month, birth_year, birth_place,
      gender, adopted,
      is_alive,
      death_day, death_month, death_year, death_place, death_cause, burial_place,
      migration_condition,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePerson({
  id,
  name, name_2, surnames, surname_1, surname_2, surname_married, prefix, suffix,
  birth_day, birth_month, birth_year, birth_place,
  gender, adopted,
  is_alive,
  death_day, death_month, death_year, death_place, death_cause, burial_place,
  migration_condition,
}) {
  const { error } = await supabase
    .from("people")
    .update({
      name, name_2, surnames, surname_1, surname_2, surname_married, prefix, suffix,
      birth_day, birth_month, birth_year, birth_place,
      gender, adopted,
      is_alive,
      death_day, death_month, death_year, death_place, death_cause, burial_place,
      migration_condition,
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

export async function fetchDistinctPlaces(field) {
  const { data, error } = await supabase
    .from("people")
    .select(field)
    .not(field, "is", null);
  if (error) throw error;
  return [...new Set(data.map(r => r[field]).filter(Boolean))].sort();
}