import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import GraphView from "./components/GraphView";
import TopNavBar from "./components/TopNavBar";
import TreeContextBar from "./components/TreeContextBar";
import TreeControlPanel from "./components/TreeControlPanel";
import PersonModal from "./components/PersonModal";
import RelationshipModal from "./components/RelationshipModal";
import AddRelativeModal from "./components/AddRelativeModal";
import { fetchPeople, fetchPeopleByIds, addPerson, updatePerson, deletePerson } from "./services/peopleService";
import { fetchRelationships, fetchRelationshipsByPersonIds, dissolveRelationship, addRelationship, updateRelationship, deleteRelationship } from "./services/relationshipService";
import { buildFamilyGraph } from "./graph/buildFamilyGraph.js";
import { supabase } from "./lib/supabase.js";
import "./App.css";

export default function App() {

  const [people, setPeople] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [focusPersonId, setFocusPersonId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [generationsCount, setGenerationsCount] = useState(5);
  const [viewMode, setViewMode] = useState("familia");
  const [modalPersona, setModalPersona] = useState(null);
  const [modalRelacion, setModalRelacion] = useState(null);
  const [modalAddRelative, setModalAddRelative] = useState(null);

  const focusInitialized = useRef(false);
  const focusWasCleared = useRef(false);

  const loadData = useCallback(async () => {
    try {
      if (focusPersonId) {
        const { data: subgraphData, error } = await supabase
          .rpc("get_subgraph", {
            focus_id: Number(focusPersonId),
            generations_up: generationsCount,
            generations_down: generationsCount,
          });
        if (error) throw error;
        const ids = subgraphData.map((r) => r.person_id);
        const [peopleData, relsData] = await Promise.all([
          fetchPeopleByIds(ids),
          fetchRelationshipsByPersonIds(ids),
        ]);
        setPeople(peopleData);
        setRelationships(relsData);
      } else {
        const [peopleData, relsData] = await Promise.all([
          fetchPeople(),
          fetchRelationships(),
        ]);
        setPeople(peopleData);
        setRelationships(relsData);

        if (!focusInitialized.current && !focusWasCleared.current && peopleData.length > 0) {
          focusInitialized.current = true;
          setFocusPersonId(String(peopleData[0].id));
          return;
        }
        focusInitialized.current = true;
      }
    } catch (error) {
      console.error(error);
    }
  }, [focusPersonId, generationsCount]);

  useEffect(() => { loadData(); }, [loadData]);

  const graph = useMemo(
    () => buildFamilyGraph(people, relationships),
    [people, relationships]
  );

  function getSuggestedSurnames(fromPersonId) {
    const fromPerson = people.find((p) => String(p.id) === String(fromPersonId));
    if (!fromPerson) return { surname1: "", surname2: "" };
    const spouseRel = relationships.find(
      (r) => (r.type === "spouse" || r.type === "co_parent") && (
        String(r.person_a_id) === String(fromPersonId) ||
        String(r.person_b_id) === String(fromPersonId)
      )
    );
    const spouseId = spouseRel
      ? String(spouseRel.person_a_id) === String(fromPersonId)
        ? String(spouseRel.person_b_id)
        : String(spouseRel.person_a_id)
      : null;
    const spouse = spouseId ? people.find((p) => String(p.id) === spouseId) : null;
    const fatherPerson = fromPerson.gender === "male" ? fromPerson : spouse;
    const motherPerson = fromPerson.gender === "female" ? fromPerson : spouse;
    return {
      surname1: fatherPerson?.surname_1 ?? "",
      surname2: motherPerson?.surname_1 ?? "",
    };
  }

  function getDefaultParentSuggestion(fromPersonId, slotType) {
    if (slotType !== "father" && slotType !== "mother") return null;
    const existingParentType = slotType === "mother" ? "father" : "mother";
    const existingParentRel = relationships.find(
      (r) => r.type === existingParentType && String(r.person_b_id) === String(fromPersonId)
    );
    if (!existingParentRel) return null;
    const existingParent = people.find((p) => String(p.id) === String(existingParentRel.person_a_id));
    if (!existingParent) return null;
    const spouseRel = relationships.find(
      (r) => (r.type === "spouse" || r.type === "co_parent") && (
        String(r.person_a_id) === String(existingParent.id) ||
        String(r.person_b_id) === String(existingParent.id)
      )
    );
    if (!spouseRel) return null;
    const spouseId = String(spouseRel.person_a_id) === String(existingParent.id)
      ? spouseRel.person_b_id
      : spouseRel.person_a_id;
    return people.find((p) => String(p.id) === String(spouseId)) ?? null;
  }

  async function handleSavePersona(personData) {
    try {
      if (personData.id) await updatePerson(personData);
      else await addPerson(personData);
      setModalPersona(null);
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDeletePersona(id) {
    try {
      const personRels = relationships.filter(
        (r) => String(r.person_a_id) === String(id) ||
          String(r.person_b_id) === String(id)
      );
      for (const rel of personRels) await deleteRelationship(rel.id);
      await deletePerson(id);
      setModalPersona(null);
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleAddRelationshipFromModal(relData) {
    try {
      await addRelationship(relData);
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSaveRelacion(relData) {
    try {
      if (relData.id) await updateRelationship(relData);
      else await addRelationship(relData);
      setModalRelacion(null);
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDeleteRelacion(id) {
    try {
      await deleteRelationship(id);
      setModalRelacion(null);
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSaveAddRelative({ person, relationship, existingPersonId }) {
    try {
      const { fromPersonId, slotType } = modalAddRelative;

      if (slotType === "spouse" || slotType === "spouse_another") {
        if (slotType === "spouse") {
          const existingSpouse = relationships.find(
            (r) => (r.type === "spouse" || r.type === "co_parent") && (
              String(r.person_a_id) === String(fromPersonId) ||
              String(r.person_b_id) === String(fromPersonId)
            )
          );
          if (existingSpouse) {
            alert("Esta persona ya tiene una pareja activa. Usá 'Agregar otra pareja'.");
            setModalAddRelative(null);
            return;
          }
        }
      }

      if (slotType === "father") {
        const existing = relationships.find(
          (r) => r.type === "father" && String(r.person_b_id) === String(fromPersonId)
        );
        if (existing) {
          alert("Esta persona ya tiene un padre registrado.");
          setModalAddRelative(null);
          return;
        }
      }

      if (slotType === "mother") {
        const existing = relationships.find(
          (r) => r.type === "mother" && String(r.person_b_id) === String(fromPersonId)
        );
        if (existing) {
          alert("Esta persona ya tiene una madre registrada.");
          setModalAddRelative(null);
          return;
        }
      }

      if (existingPersonId) {
        if (slotType === "spouse" || slotType === "spouse_another") {
          await addRelationship({
            person_a_id: Number(fromPersonId),
            person_b_id: Number(existingPersonId),
            type: relationship?.type ?? "spouse",
            marriage_day: relationship?.marriage_day ?? null,
            marriage_month: relationship?.marriage_month ?? null,
            marriage_year: relationship?.marriage_year ?? null,
            marriage_place: relationship?.marriage_place ?? null,
            notes: relationship?.notes ?? null,
          });
        } else {
          await addRelationship({
            person_a_id: Number(existingPersonId),
            person_b_id: Number(fromPersonId),
            type: slotType,
          });
        }
        setModalAddRelative(null);
        loadData();
        return;
      }

      const newPerson = await addPerson(person);
      if (!newPerson) throw new Error("No se pudo crear la persona");

      if (slotType === "father" || slotType === "mother") {
        await addRelationship({
          person_a_id: newPerson.id,
          person_b_id: Number(fromPersonId),
          type: slotType,
        });

      } else if (slotType === "son" || slotType === "daughter") {
        const fromPerson = people.find((p) => String(p.id) === String(fromPersonId));
        const relType = fromPerson?.gender === "female" ? "mother" : "father";
        await addRelationship({
          person_a_id: Number(fromPersonId),
          person_b_id: newPerson.id,
          type: relType,
        });
        if (relationship?.otherParentId) {
          const otherParent = people.find((p) => String(p.id) === String(relationship.otherParentId));
          const otherType = otherParent?.gender === "female" ? "mother" : "father";
          await addRelationship({
            person_a_id: Number(relationship.otherParentId),
            person_b_id: newPerson.id,
            type: otherType,
          });
        }
        if (relationship?.otherParentNew) {
          const newOther = await addPerson(relationship.otherParentNew);
          if (newOther) {
            const otherType = relationship.otherParentNew.gender === "female" ? "mother" : "father";
            await addRelationship({
              person_a_id: newOther.id,
              person_b_id: newPerson.id,
              type: otherType,
            });
          }
        }

      } else if (slotType === "spouse" || slotType === "spouse_another") {
        await addRelationship({
          person_a_id: Number(fromPersonId),
          person_b_id: newPerson.id,
          type: relationship?.type ?? "spouse",
          marriage_day: relationship.marriage_day,
          marriage_month: relationship.marriage_month,
          marriage_year: relationship.marriage_year,
          marriage_place: relationship.marriage_place,
          notes: relationship.notes,
        });

      } else if (slotType === "brother" || slotType === "sister") {
        const parentRels = relationships.filter(
          (r) => (r.type === "father" || r.type === "mother") &&
            String(r.person_b_id) === String(fromPersonId)
        );
        for (const parentRel of parentRels) {
          await addRelationship({
            person_a_id: parentRel.person_a_id,
            person_b_id: newPerson.id,
            type: parentRel.type,
          });
        }
      }

      setModalAddRelative(null);
      loadData();
    } catch (error) {
      console.error(error);
      setModalAddRelative(null);
    }
  }

  async function handleDissolveSpouse(relId, untilYear) {
    try {
      await dissolveRelationship(relId, untilYear);
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  function handleSelectNode(nodeId) {
    setSelectedNodeId((prev) => prev === nodeId ? null : nodeId);
  }

  function handleAddRelativeFromNode(nodeId, slotType) {
    setModalAddRelative({ fromPersonId: nodeId, slotType });
  }

  function handleEditPerson(nodeId) {
    const person = people.find((p) => String(p.id) === String(nodeId));
    if (person) setModalPersona({ person });
  }

  function handleFocusPerson(nodeId) {
    setFocusPersonId(String(nodeId));
    setSelectedNodeId(null);
  }

  function handleClearFocus() {
    focusWasCleared.current = true;
    setFocusPersonId(null);
  }

  const focusPerson = people.find((p) => String(p.id) === String(focusPersonId));
  const focusPersonName = focusPerson
    ? `${focusPerson.name} ${focusPerson.surnames ?? ""}`.trim()
    : null;
  const personCount = graph.nodes.filter((n) => n.type === "person").length;
  const modalPersonaObj = modalPersona === "new" ? null : modalPersona?.person ?? null;

  const addRelativeFromPerson = modalAddRelative
    ? people.find((p) => String(p.id) === String(modalAddRelative.fromPersonId)) ?? null
    : null;

  const addRelativeSuggested = modalAddRelative
    ? getSuggestedSurnames(modalAddRelative.fromPersonId)
    : { surname1: "", surname2: "" };

  // Incluye co_parent como opción de otro progenitor
  const addRelativeOtherParentOptions = modalAddRelative &&
    (modalAddRelative.slotType === "son" || modalAddRelative.slotType === "daughter")
    ? (() => {
      const spouseRels = relationships.filter(
        (r) => (r.type === "spouse" || r.type === "co_parent") && (
          String(r.person_a_id) === String(modalAddRelative.fromPersonId) ||
          String(r.person_b_id) === String(modalAddRelative.fromPersonId)
        )
      );
      return spouseRels.map((r) => {
        const spouseId = String(r.person_a_id) === String(modalAddRelative.fromPersonId)
          ? r.person_b_id
          : r.person_a_id;
        const spouse = people.find((p) => String(p.id) === String(spouseId));
        return spouse ? { ...spouse, isActive: r.until_year == null } : null;
      }).filter(Boolean);
    })()
    : [];

  const addRelativeParentCandidates = modalAddRelative &&
    (modalAddRelative.slotType === "father" || modalAddRelative.slotType === "mother")
    ? people.filter((p) => {
      if (String(p.id) === String(modalAddRelative.fromPersonId)) return false;
      if (modalAddRelative.slotType === "father") return p.gender === "male" || p.gender === "unknown";
      if (modalAddRelative.slotType === "mother") return p.gender === "female" || p.gender === "unknown";
      return true;
    })
    : [];

  const addRelativeDefaultParent = modalAddRelative
    ? getDefaultParentSuggestion(modalAddRelative.fromPersonId, modalAddRelative.slotType)
    : null;

  const addRelativeSpouseCandidates = modalAddRelative &&
    (modalAddRelative.slotType === "spouse" || modalAddRelative.slotType === "spouse_another")
    ? people.filter((p) => String(p.id) !== String(modalAddRelative.fromPersonId))
    : [];

  return (
    <div className="app-shell">

      <TopNavBar />

      <div className="banner-slot">
        Espacio reservado para banner — si no está en uso, este espacio se colapsa.
      </div>

      <TreeContextBar
        treeOwner={people[0]?.name ?? null}
        focusPerson={focusPersonName}
        totalPersons={people.length}
        renderedPersons={personCount}
        onOpenFocusPerson={() => focusPersonId && setSelectedNodeId(focusPersonId)}
        onClearFocus={handleClearFocus}
      />

      <TreeControlPanel
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        generationsCount={generationsCount}
        onGenerationsChange={setGenerationsCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddPerson={() => setModalPersona("new")}
      />

      <main className="app-canvas-area">
        <GraphView
          graph={graph}
          onDissolveSpouse={handleDissolveSpouse}
          focusNodeId={focusPersonId}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          onAddRelative={handleAddRelativeFromNode}
          onEditPerson={handleEditPerson}
          onDeletePerson={handleDeletePersona}
          onFocusPerson={handleFocusPerson}
          searchQuery={searchQuery}
        />
      </main>

      {modalPersona !== null && (
        <PersonModal
          person={modalPersonaObj}
          people={people}
          relationships={relationships}
          onSave={handleSavePersona}
          onDelete={handleDeletePersona}
          onAddRelationship={handleAddRelationshipFromModal}
          onClose={() => setModalPersona(null)}
        />
      )}

      {modalRelacion !== null && (
        <RelationshipModal
          relationship={modalRelacion}
          people={people}
          onSave={handleSaveRelacion}
          onDelete={handleDeleteRelacion}
          onClose={() => setModalRelacion(null)}
        />
      )}

      {modalAddRelative !== null && (
        <AddRelativeModal
          slotType={modalAddRelative.slotType}
          fromPerson={addRelativeFromPerson}
          otherParentOptions={addRelativeOtherParentOptions}
          parentCandidates={addRelativeParentCandidates}
          spouseCandidates={addRelativeSpouseCandidates}
          defaultParent={addRelativeDefaultParent}
          suggestedSurname1={addRelativeSuggested.surname1}
          suggestedSurname2={addRelativeSuggested.surname2}
          onSave={handleSaveAddRelative}
          onClose={() => setModalAddRelative(null)}
        />
      )}

    </div>
  );
}