import { useEffect, useMemo, useState } from "react";
import GraphView from "./components/GraphView";
import TopNavBar from "./components/TopNavBar";
import TreeContextBar from "./components/TreeContextBar";
import TreeControlPanel from "./components/TreeControlPanel";
import PersonModal from "./components/PersonModal";
import RelationshipModal from "./components/RelationshipModal";
import AddRelativeModal from "./components/AddRelativeModal";
import { fetchPeople, addPerson, updatePerson, deletePerson } from "./services/peopleService";
import { fetchRelationships, dissolveRelationship, addRelationship, updateRelationship, deleteRelationship } from "./services/relationshipService";
import { buildFamilyGraph } from "./graph/buildFamilyGraph.js";
import "./App.css";

export default function App() {

  // ── Data state ───────────────────────────────────────────────────────────
  const [people, setPeople] = useState([]);
  const [relationships, setRelationships] = useState([]);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [focusNodeId, setFocusNodeId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [generationsCount, setGenerationsCount] = useState(5);
  const [viewMode, setViewMode] = useState("familia");

  // ── Modal state ──────────────────────────────────────────────────────────
  const [modalPersona, setModalPersona] = useState(null);
  const [modalRelacion, setModalRelacion] = useState(null);
  const [modalAddRelative, setModalAddRelative] = useState(null);

  // ── Data loading ─────────────────────────────────────────────────────────
  async function loadData() {
    try {
      const [peopleData, relsData] = await Promise.all([
        fetchPeople(),
        fetchRelationships(),
      ]);
      setPeople(peopleData);
      setRelationships(relsData);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => { loadData(); }, []);

  // ── Graph ────────────────────────────────────────────────────────────────
  const graph = useMemo(
    () => buildFamilyGraph(people, relationships),
    [people, relationships]
  );

  // ── Apellidos sugeridos ───────────────────────────────────────────────────
  function getSuggestedSurnames(fromPersonId) {
    const fromPerson = people.find((p) => String(p.id) === String(fromPersonId));
    if (!fromPerson) return { surname1: "", surname2: "" };

    const spouseRel = relationships.find(
      (r) => r.type === "spouse" && (
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

  // ── Handlers — PersonModal ────────────────────────────────────────────────
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
      for (const rel of personRels) {
        await deleteRelationship(rel.id);
      }
      await deletePerson(id);
      setModalPersona(null);
      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  // ── Handlers — RelationshipModal ──────────────────────────────────────────
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

  // ── Handlers — AddRelativeModal ───────────────────────────────────────────
  async function handleSaveAddRelative({ person, relationship }) {
    try {
      const { fromPersonId, slotType } = modalAddRelative;

      if (slotType === "spouse" || slotType === "spouse_another") {
        if (slotType === "spouse") {
          const existingSpouse = relationships.find(
            (r) => r.type === "spouse" && (
              String(r.person_a_id) === String(fromPersonId) ||
              String(r.person_b_id) === String(fromPersonId)
            )
          );
          if (existingSpouse) {
            alert("Esta persona ya tiene un cónyuge activo. Usá 'Agregar otra pareja'.");
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

      } else if (slotType === "spouse" || slotType === "spouse_another") {
        await addRelationship({
          person_a_id: Number(fromPersonId),
          person_b_id: newPerson.id,
          type: "spouse",
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

  // ── Handlers — grafo ──────────────────────────────────────────────────────
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

  function handleOpenFocusPerson() {
    if (focusNodeId) setSelectedNodeId(focusNodeId);
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const focusPerson = graph.nodes.find((n) => n.id === focusNodeId);
  const focusPersonName = focusPerson?.data?.name ?? null;
  const personCount = graph.nodes.filter((n) => n.type === "person").length;

  const modalPersonaObj = modalPersona === "new" ? null : modalPersona?.person ?? null;

  const addRelativeFromPerson = modalAddRelative
    ? people.find((p) => String(p.id) === String(modalAddRelative.fromPersonId)) ?? null
    : null;

  const addRelativeSuggested = modalAddRelative
    ? getSuggestedSurnames(modalAddRelative.fromPersonId)
    : { surname1: "", surname2: "" };

  const addRelativeOtherParent = modalAddRelative &&
    (modalAddRelative.slotType === "son" || modalAddRelative.slotType === "daughter")
    ? (() => {
      const spouseRel = relationships.find(
        (r) => r.type === "spouse" && (
          String(r.person_a_id) === String(modalAddRelative.fromPersonId) ||
          String(r.person_b_id) === String(modalAddRelative.fromPersonId)
        )
      );
      if (!spouseRel) return null;
      const spouseId = String(spouseRel.person_a_id) === String(modalAddRelative.fromPersonId)
        ? spouseRel.person_b_id
        : spouseRel.person_a_id;
      return people.find((p) => String(p.id) === String(spouseId)) ?? null;
    })()
    : null;

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
        onOpenFocusPerson={handleOpenFocusPerson}
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
          focusNodeId={focusNodeId}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          onAddRelative={handleAddRelativeFromNode}
          onEditPerson={handleEditPerson}
          onDeletePerson={handleEditPerson}
          searchQuery={searchQuery}
        />
      </main>

      {/* Modal editar persona */}
      {modalPersona !== null && (
        <PersonModal
          person={modalPersonaObj}
          onSave={handleSavePersona}
          onDelete={handleDeletePersona}
          onClose={() => setModalPersona(null)}
        />
      )}

      {/* Modal editar relación existente */}
      {modalRelacion !== null && (
        <RelationshipModal
          relationship={modalRelacion}
          people={people}
          onSave={handleSaveRelacion}
          onDelete={handleDeleteRelacion}
          onClose={() => setModalRelacion(null)}
        />
      )}

      {/* Modal agregar familiar desde nodo fantasma */}
      {modalAddRelative !== null && (
        <AddRelativeModal
          slotType={modalAddRelative.slotType}
          fromPerson={addRelativeFromPerson}
          otherParent={addRelativeOtherParent}
          suggestedSurname1={addRelativeSuggested.surname1}
          suggestedSurname2={addRelativeSuggested.surname2}
          onSave={handleSaveAddRelative}
          onClose={() => setModalAddRelative(null)}
        />
      )}

    </div>
  );
}