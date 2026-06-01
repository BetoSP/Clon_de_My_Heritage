import { supabase } from "../lib/supabase";

export async function fetchRelationships() {
  const { data, error } = await supabase
    .from("relationships")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;
  return data;
}

export async function addRelationship({
  person_a_id, person_b_id, type,
  since_year, until_year, notes,
  marriage_place, marriage_day, marriage_month, marriage_year,
}) {
  let a = person_a_id;
  let b = person_b_id;

  // DECISIONS.md [003]: orden canónico para spouse
  if (type === "spouse") {
    a = Math.min(person_a_id, person_b_id);
    b = Math.max(person_a_id, person_b_id);
  }

  const { error } = await supabase
    .from("relationships")
    .insert([{
      person_a_id: a, person_b_id: b, type,
      since_year: since_year ?? null,
      until_year: until_year ?? null,
      notes: notes ?? null,
      marriage_place: marriage_place ?? null,
      marriage_day: marriage_day ?? null,
      marriage_month: marriage_month ?? null,
      marriage_year: marriage_year ?? null,
    }]);

  if (error) throw error;
}

export async function updateRelationship({
  id, type,
  since_year, until_year, notes,
  marriage_place, marriage_day, marriage_month, marriage_year,
}) {
  const { error } = await supabase
    .from("relationships")
    .update({
      type,
      since_year: since_year ?? null,
      until_year: until_year ?? null,
      notes: notes ?? null,
      marriage_place: marriage_place ?? null,
      marriage_day: marriage_day ?? null,
      marriage_month: marriage_month ?? null,
      marriage_year: marriage_year ?? null,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteRelationship(id) {
  const { error } = await supabase
    .from("relationships")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function dissolveRelationship(id, until_year) {
  const { error } = await supabase
    .from("relationships")
    .update({ until_year })
    .eq("id", id)
    .eq("type", "spouse");

  if (error) throw error;
}