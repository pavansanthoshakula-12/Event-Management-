// End-to-end API smoke test. It talks to a RUNNING server (npm run dev) and a seeded admin.
//   1. npm run seed:admin
//   2. npm run dev            (in another terminal)
//   3. npm run test:api
// It creates its own test students/events (names start with "TEST ") and never needs cleanup to re-run.
import dotenv from "dotenv";
import assert from "node:assert/strict";

dotenv.config();

const BASE = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}/api`;
const RUN = Date.now().toString(36);
let passed = 0;
let failed = 0;

const api = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, json };
};

const test = async (name, fn) => {
  try {
    await fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL  ${name}\n        ${err.message}`);
  }
};

const day = (n) => new Date(Date.now() + n * 86400000);
const eventBody = (overrides = {}) => ({
  title: `TEST Event ${RUN}`,
  description: "Created by the automated API test",
  category: "Technical",
  eventDate: day(10).toISOString().slice(0, 10),
  startTime: "10:00",
  endTime: "12:00",
  venue: "Main Auditorium",
  organizer: "Test Club",
  registrationDeadline: day(5).toISOString(),
  maxParticipants: 50,
  status: "Upcoming",
  ...overrides,
});

const makeStudent = async (label) => {
  const n = `${RUN}${label}`;
  const email = `student_${n}@test.edu`;
  const res = await api("POST", "/auth/register", {
    body: { name: `Test Student ${label}`, email, password: "Passw0rdTest", rollNumber: `R${n}`, department: "CSE", yearOfStudy: 2 },
  });
  assert.equal(res.status, 201, `register failed: ${JSON.stringify(res.json)}`);
  return { token: res.json.data.token, user: res.json.data.user, email };
};

const run = async () => {
  console.log(`\nTesting ${BASE}\n`);

  const health = await api("GET", "/health");
  assert.equal(health.status, 200, "Server is not running. Start it with: npm run dev");

  const adminLogin = await api("POST", "/auth/login", {
    body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
  });
  assert.equal(adminLogin.status, 200, "Admin login failed. Did you run: npm run seed:admin ?");
  const admin = adminLogin.json.data.token;

  const alice = await makeStudent("a");
  const bob = await makeStudent("b");
  let event;
  let regAlice;

  console.log("Authentication");
  await test("student sign-up always creates role=student (cannot self-promote)", async () => {
    const res = await api("POST", "/auth/register", {
      body: { name: "Sneaky", email: `sneaky_${RUN}@test.edu`, password: "Passw0rdTest", rollNumber: `S${RUN}`, department: "CSE", yearOfStudy: 1, role: "admin" },
    });
    assert.equal(res.status, 201);
    assert.equal(res.json.data.user.role, "student");
  });
  await test("password hash is never returned", async () => {
    assert.equal(alice.user.password, undefined);
  });
  await test("duplicate email is rejected (409)", async () => {
    const res = await api("POST", "/auth/register", {
      body: { name: "Dup", email: alice.email, password: "Passw0rdTest", rollNumber: `D${RUN}`, department: "CSE", yearOfStudy: 1 },
    });
    assert.equal(res.status, 409);
  });
  await test("weak password / missing fields -> 400 with message", async () => {
    const res = await api("POST", "/auth/register", { body: { name: "x", email: "bad", password: "123" } });
    assert.equal(res.status, 400);
    assert.ok(res.json.message);
  });
  await test("wrong password -> 401", async () => {
    const res = await api("POST", "/auth/login", { body: { email: alice.email, password: "WrongPass123" } });
    assert.equal(res.status, 401);
  });
  await test("GET /auth/me returns the logged-in user", async () => {
    const res = await api("GET", "/auth/me", { token: alice.token });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.email, alice.email);
  });

  console.log("\nScenario 1-4: admin event CRUD");
  await test("1. admin can create an event", async () => {
    const res = await api("POST", "/events", { token: admin, body: eventBody() });
    assert.equal(res.status, 201, JSON.stringify(res.json));
    event = res.json.data;
    assert.equal(event.registeredCount, 0);
  });
  await test("1b. create with missing fields -> 400", async () => {
    const res = await api("POST", "/events", { token: admin, body: { title: "x" } });
    assert.equal(res.status, 400);
  });
  await test("1c. end time before start time -> 400", async () => {
    const res = await api("POST", "/events", { token: admin, body: eventBody({ startTime: "14:00", endTime: "13:00" }) });
    assert.equal(res.status, 400);
  });
  await test("2. admin can view all events (search + filter + pagination)", async () => {
    const res = await api("GET", `/events?search=${encodeURIComponent("TEST Event " + RUN)}&category=Technical&status=Upcoming&limit=5`, { token: admin });
    assert.equal(res.status, 200);
    assert.ok(res.json.data.some((e) => e._id === event._id));
    assert.ok(res.json.pagination.total >= 1);
  });
  await test("2b. admin can view event details", async () => {
    const res = await api("GET", `/events/${event._id}`, { token: admin });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.title, event.title);
  });
  await test("3. admin can update an event", async () => {
    const res = await api("PUT", `/events/${event._id}`, { token: admin, body: eventBody({ venue: "Seminar Hall 2", maxParticipants: 60 }) });
    assert.equal(res.status, 200, JSON.stringify(res.json));
    assert.equal(res.json.data.venue, "Seminar Hall 2");
    assert.equal(res.json.data.maxParticipants, 60);
  });
  await test("4. admin can delete an event with no registrations", async () => {
    const tmp = await api("POST", "/events", { token: admin, body: eventBody({ title: `TEST Disposable ${RUN}` }) });
    const del = await api("DELETE", `/events/${tmp.json.data._id}`, { token: admin });
    assert.equal(del.status, 200);
    const again = await api("GET", `/events/${tmp.json.data._id}`, { token: admin });
    assert.equal(again.status, 404);
  });

  console.log("\nScenario 5-9: registrations");
  await test("5. student can register for an event", async () => {
    const res = await api("POST", "/registrations", { token: alice.token, body: { eventId: event._id, remarks: "Looking forward" } });
    assert.equal(res.status, 201, JSON.stringify(res.json));
    assert.equal(res.json.data.status, "Pending");
    regAlice = res.json.data;
    const ev = await api("GET", `/events/${event._id}`, { token: admin });
    assert.equal(ev.json.data.registeredCount, 1);
  });
  await test("6. student cannot register twice", async () => {
    const res = await api("POST", "/registrations", { token: alice.token, body: { eventId: event._id } });
    assert.equal(res.status, 409);
    const ev = await api("GET", `/events/${event._id}`, { token: admin });
    assert.equal(ev.json.data.registeredCount, 1, "seat count must not change");
  });
  await test("7. student can view their own registrations only", async () => {
    const mine = await api("GET", "/registrations/my", { token: alice.token });
    assert.equal(mine.status, 200);
    assert.equal(mine.json.data.length, 1);
    assert.equal(mine.json.data[0].canCancel, true);
    const found = await api("GET", `/registrations/my?search=${encodeURIComponent("TEST Event")}&status=Pending`, { token: alice.token });
    assert.equal(found.json.data.length, 1, "search + status filter");
    const none = await api("GET", "/registrations/my?search=zzzznomatch", { token: alice.token });
    assert.equal(none.json.data.length, 0);
    const bobs = await api("GET", "/registrations/my", { token: bob.token });
    assert.equal(bobs.json.data.length, 0);
  });
  await test("8. admin can view all registrations with student details", async () => {
    const res = await api("GET", `/registrations?search=${encodeURIComponent(alice.user.rollNumber)}`, { token: admin });
    assert.equal(res.status, 200);
    const row = res.json.data.find((r) => r._id === regAlice._id);
    assert.ok(row && row.student.email === alice.email && row.event.title);
  });
  await test("8b. admin can approve, then reject, and seat count follows", async () => {
    let res = await api("PUT", `/registrations/${regAlice._id}`, { token: admin, body: { status: "Approved", adminNote: "ok" } });
    assert.equal(res.status, 200, JSON.stringify(res.json));
    assert.equal(res.json.data.status, "Approved");
    res = await api("PUT", `/registrations/${regAlice._id}`, { token: admin, body: { status: "Rejected" } });
    assert.equal(res.json.data.status, "Rejected");
    let ev = await api("GET", `/events/${event._id}`, { token: admin });
    assert.equal(ev.json.data.registeredCount, 0, "rejected frees the seat");
    res = await api("PUT", `/registrations/${regAlice._id}`, { token: admin, body: { status: "Approved" } });
    assert.equal(res.json.data.status, "Approved");
    ev = await api("GET", `/events/${event._id}`, { token: admin });
    assert.equal(ev.json.data.registeredCount, 1, "re-approving takes the seat again");
  });
  await test("8c. invalid status value -> 400", async () => {
    const res = await api("PUT", `/registrations/${regAlice._id}`, { token: admin, body: { status: "Banana" } });
    assert.equal(res.status, 400);
  });
  await test("9. another student cannot read, edit or cancel Alice's registration (403)", async () => {
    assert.equal((await api("GET", `/registrations/${regAlice._id}`, { token: bob.token })).status, 403);
    assert.equal((await api("PUT", `/registrations/${regAlice._id}`, { token: bob.token, body: { remarks: "hacked" } })).status, 403);
    assert.equal((await api("PATCH", `/registrations/${regAlice._id}/cancel`, { token: bob.token })).status, 403);
  });
  await test("9b. student cannot change their own status (403)", async () => {
    const res = await api("PUT", `/registrations/${regAlice._id}`, { token: alice.token, body: { status: "Approved" } });
    assert.equal(res.status, 403);
  });
  await test("9c. student can edit their own remarks", async () => {
    const res = await api("PUT", `/registrations/${regAlice._id}`, { token: alice.token, body: { remarks: "Updated remark" } });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.remarks, "Updated remark");
  });

  console.log("\nScenario 10-12: security and errors");
  await test("10. unauthenticated requests are rejected (401)", async () => {
    for (const [m, p] of [["GET", "/events"], ["GET", "/registrations"], ["GET", "/registrations/my"], ["POST", "/events"], ["GET", "/auth/me"]]) {
      assert.equal((await api(m, p)).status, 401, `${m} ${p}`);
    }
  });
  await test("10b. garbage token -> 401", async () => {
    assert.equal((await api("GET", "/events", { token: "not.a.token" })).status, 401);
  });
  await test("11. students cannot use admin-only endpoints (403)", async () => {
    assert.equal((await api("POST", "/events", { token: alice.token, body: eventBody() })).status, 403);
    assert.equal((await api("PUT", `/events/${event._id}`, { token: alice.token, body: eventBody() })).status, 403);
    assert.equal((await api("DELETE", `/events/${event._id}`, { token: alice.token })).status, 403);
    assert.equal((await api("GET", "/registrations", { token: alice.token })).status, 403);
    assert.equal((await api("DELETE", `/registrations/${regAlice._id}`, { token: alice.token })).status, 403);
    assert.equal((await api("GET", "/events/stats", { token: alice.token })).status, 403);
  });
  await test("11b. admin cannot register for events (student-only)", async () => {
    assert.equal((await api("POST", "/registrations", { token: admin, body: { eventId: event._id } })).status, 403);
  });
  await test("12. invalid ids -> 400, missing records -> 404", async () => {
    assert.equal((await api("GET", "/events/not-an-id", { token: admin })).status, 400);
    assert.equal((await api("GET", "/events/64b7f0c2a1b2c3d4e5f60789", { token: admin })).status, 404);
    assert.equal((await api("GET", "/registrations/64b7f0c2a1b2c3d4e5f60789", { token: admin })).status, 404);
    assert.equal((await api("POST", "/registrations", { token: alice.token, body: { eventId: "64b7f0c2a1b2c3d4e5f60789" } })).status, 404);
    assert.equal((await api("POST", "/registrations", { token: alice.token, body: { eventId: "bad" } })).status, 400);
    assert.equal((await api("GET", "/nope", { token: admin })).status, 404);
  });

  console.log("\nScenario 13: closed events");
  await test("13. cancelled event rejects registration", async () => {
    const e = await api("POST", "/events", { token: admin, body: eventBody({ title: `TEST Cancelled ${RUN}`, status: "Cancelled" }) });
    const res = await api("POST", "/registrations", { token: bob.token, body: { eventId: e.json.data._id } });
    assert.equal(res.status, 400);
    assert.match(res.json.message, /cancelled/i);
  });
  await test("13b. event past its deadline rejects registration", async () => {
    const e = await api("POST", "/events", { token: admin, body: eventBody({ title: `TEST Late ${RUN}`, eventDate: day(2).toISOString().slice(0, 10), registrationDeadline: day(-1).toISOString() }) });
    const res = await api("POST", "/registrations", { token: bob.token, body: { eventId: e.json.data._id } });
    assert.equal(res.status, 400);
    assert.match(res.json.message, /deadline/i);
  });
  await test("13c. full event rejects registration; cancelling frees a seat; re-registering reuses the record", async () => {
    const e = await api("POST", "/events", { token: admin, body: eventBody({ title: `TEST Tiny ${RUN}`, maxParticipants: 1 }) });
    const id = e.json.data._id;
    const first = await api("POST", "/registrations", { token: alice.token, body: { eventId: id } });
    assert.equal(first.status, 201);
    const second = await api("POST", "/registrations", { token: bob.token, body: { eventId: id } });
    assert.equal(second.status, 409);
    assert.match(second.json.message, /full/i);
    const cancel = await api("PATCH", `/registrations/${first.json.data._id}/cancel`, { token: alice.token });
    assert.equal(cancel.status, 200);
    assert.equal(cancel.json.data.status, "Cancelled");
    assert.equal((await api("PATCH", `/registrations/${first.json.data._id}/cancel`, { token: alice.token })).status, 400);
    const bobIn = await api("POST", "/registrations", { token: bob.token, body: { eventId: id } });
    assert.equal(bobIn.status, 201, "freed seat should be available");
    const aliceBack = await api("POST", "/registrations", { token: alice.token, body: { eventId: id } });
    assert.equal(aliceBack.status, 409, "event full again");
    await api("PATCH", `/registrations/${bobIn.json.data._id}/cancel`, { token: bob.token });
    const again = await api("POST", "/registrations", { token: alice.token, body: { eventId: id } });
    assert.equal(again.status, 201);
    assert.equal(again.json.data._id, first.json.data._id, "same record is re-activated");
  });
  await test("13d. cannot lower capacity below seats already taken", async () => {
    const res = await api("PUT", `/events/${event._id}`, { token: admin, body: eventBody({ maxParticipants: 1, registrationDeadline: day(5).toISOString() }) });
    assert.equal(res.status, 200); // 1 seat taken, capacity 1 is OK
    const res2 = await api("PUT", `/events/${event._id}`, { token: admin, body: eventBody({ maxParticipants: 0 }) });
    assert.equal(res2.status, 400);
    await api("PUT", `/events/${event._id}`, { token: admin, body: eventBody({ maxParticipants: 60 }) });
  });

  console.log("\nScenario 14: concurrency");
  await test("14. 12 simultaneous registrations for 3 seats -> exactly 3 succeed", async () => {
    const e = await api("POST", "/events", { token: admin, body: eventBody({ title: `TEST Race ${RUN}`, maxParticipants: 3 }) });
    const id = e.json.data._id;
    const students = await Promise.all(Array.from({ length: 12 }, (_, i) => makeStudent(`r${i}`)));
    const results = await Promise.all(students.map((s) => api("POST", "/registrations", { token: s.token, body: { eventId: id } })));
    const ok = results.filter((r) => r.status === 201).length;
    const full = results.filter((r) => r.status === 409).length;
    assert.equal(ok, 3, `expected 3 successes, got ${ok}`);
    assert.equal(full, 9);
    const ev = await api("GET", `/events/${id}`, { token: admin });
    assert.equal(ev.json.data.registeredCount, 3);
  });
  await test("14b. same student clicking 6 times at once -> one registration", async () => {
    const e = await api("POST", "/events", { token: admin, body: eventBody({ title: `TEST Double ${RUN}` }) });
    const id = e.json.data._id;
    const s = await makeStudent("dbl");
    const results = await Promise.all(Array.from({ length: 6 }, () => api("POST", "/registrations", { token: s.token, body: { eventId: id } })));
    assert.equal(results.filter((r) => r.status === 201).length, 1);
    const ev = await api("GET", `/events/${id}`, { token: admin });
    assert.equal(ev.json.data.registeredCount, 1, "seat counter must match");
    const mine = await api("GET", "/registrations/my", { token: s.token });
    assert.equal(mine.json.data.length, 1);
  });

  console.log("\nScenario 15: deletion policy");
  await test("15. event with registrations cannot be deleted (409) but can be cancelled", async () => {
    const del = await api("DELETE", `/events/${event._id}`, { token: admin });
    assert.equal(del.status, 409);
    assert.match(del.json.message, /Cancelled/);
    const still = await api("GET", `/events/${event._id}`, { token: admin });
    assert.equal(still.status, 200);
    const cancelled = await api("PUT", `/events/${event._id}`, { token: admin, body: eventBody({ status: "Cancelled", maxParticipants: 60 }) });
    assert.equal(cancelled.json.data.status, "Cancelled");
    const regs = await api("GET", `/registrations?eventId=${event._id}`, { token: admin });
    assert.ok(regs.json.data.length >= 1, "registration records are preserved");
  });
  await test("15b. admin deleting a registration frees the seat", async () => {
    const e = await api("POST", "/events", { token: admin, body: eventBody({ title: `TEST AdminDelete ${RUN}`, maxParticipants: 5 }) });
    const r = await api("POST", "/registrations", { token: bob.token, body: { eventId: e.json.data._id } });
    assert.equal(r.status, 201);
    const del = await api("DELETE", `/registrations/${r.json.data._id}`, { token: admin });
    assert.equal(del.status, 200);
    const ev = await api("GET", `/events/${e.json.data._id}`, { token: admin });
    assert.equal(ev.json.data.registeredCount, 0);
    assert.equal((await api("DELETE", `/events/${e.json.data._id}`, { token: admin })).status, 200, "now deletable");
  });
  await test("dashboard stats endpoint works for admin", async () => {
    const res = await api("GET", "/events/stats", { token: admin });
    assert.equal(res.status, 200);
    assert.ok(res.json.data.totalEvents >= 1);
    assert.ok(Array.isArray(res.json.data.recentRegistrations));
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
};

run().catch((err) => {
  console.error("\nTest run aborted:", err.message);
  process.exit(1);
});
