// @ts-nocheck Expo's generated native style typings are broader than this compact prototype.
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api, clearSession, Dashboard, login, logout, Project, register, restoreSession, Task, User } from "./api";

const colors = { ink: "#2e2b27", muted: "#766f65", paper: "#f7f1e8", card: "#fffdf9", accent: "#d96b45", sage: "#6d8c6d", line: "#e5d9ca", white: "#ffffff" };
const statuses = ["all", "pending", "in_progress", "completed"];
const priorities = ["all", "low", "medium", "high"];

function Button({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  return <Pressable onPress={onPress} style={[styles.button, secondary && styles.secondaryButton]}><Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{label}</Text></Pressable>;
}

function Field({ value, onChangeText, placeholder, secureTextEntry = false }: { value: string; onChangeText: (value: string) => void; placeholder: string; secureTextEntry?: boolean }) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9b9082" secureTextEntry={secureTextEntry} autoCapitalize="none" style={styles.input} />;
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    if (!email.includes("@") || password.length < 8 || (mode === "register" && fullName.trim().length < 2)) {
      setError(mode === "register" ? "Enter your name, a valid email, and a password of at least 8 characters." : "Enter a valid email and password of at least 8 characters."); return;
    }
    setBusy(true); setError("");
    try { onAuthenticated(mode === "login" ? await login(email, password) : await register(fullName, email, password)); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to sign in."); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={styles.authScreen}><StatusBar barStyle="dark-content" /><View style={styles.authInner}><Image source={require("./assets/logo.png")} style={styles.logoImage} resizeMode="contain" /><Text style={styles.eyebrow}>PROJECT WORKSPACE</Text><Text style={styles.authTitle}>{mode === "login" ? "Welcome back." : "Start with a clear plan."}</Text><Text style={styles.authCopy}>{mode === "login" ? "Your projects and tasks, ready when you are." : "Create one account for web and mobile."}</Text>{mode === "register" && <Field value={fullName} onChangeText={setFullName} placeholder="Full name" />}<Field value={email} onChangeText={setEmail} placeholder="Email address" /><Field value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />{error ? <Text style={styles.error}>{error}</Text> : null}<Button label={busy ? "Working..." : mode === "login" ? "Sign in" : "Create account"} onPress={submit} /><Pressable onPress={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}><Text style={styles.switchText}>{mode === "login" ? "Need an account? Create one" : "Already registered? Sign in"}</Text></Pressable></View></SafeAreaView>;
}

function Stat({ label, value }: { label: string; value: number }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

function TaskRow({ task, onComplete, onEdit, onDelete }: { task: Task; onComplete: () => void; onEdit: () => void; onDelete: () => void }) {
  return <View style={styles.taskRow}><Pressable onPress={onComplete} style={[styles.check, task.status === "completed" && styles.checked]}><Text style={styles.checkText}>{task.status === "completed" ? "✓" : ""}</Text></Pressable><View style={styles.taskBody}><Text style={[styles.taskName, task.status === "completed" && styles.done]}>{task.name}</Text><Text style={styles.taskMeta}>{task.priority.toUpperCase()}  ·  {task.status.replace("_", " ")}</Text></View><Pressable onPress={onEdit}><Text style={styles.action}>Edit</Text></Pressable><Pressable onPress={onDelete}><Text style={[styles.action, styles.delete]}>Delete</Text></Pressable></View>;
}

function TaskEditor({ projects, editing, onSave, onCancel }: { projects: Project[]; editing?: Task; onSave: (data: { name: string; projectId: string; priority: string; status: string; dueDate: string }) => void; onCancel: () => void }) {
  const [name, setName] = useState(editing?.name || "");
  const [projectId, setProjectId] = useState(editing?.projectId || projects[0]?.id || "");
  const [priority, setPriority] = useState(editing?.priority || "medium");
  const [status, setStatus] = useState(editing?.status || "pending");
  const [dueDate, setDueDate] = useState(editing?.dueDate || new Date().toISOString().slice(0, 10));
  return <View style={styles.editor}><Text style={styles.sectionTitle}>{editing ? "Edit task" : "New task"}</Text><Field value={name} onChangeText={setName} placeholder="Task name" /><Text style={styles.fieldLabel}>Project</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{projects.map((project) => <Pressable key={project.id} onPress={() => setProjectId(project.id)} style={[styles.chip, project.id === projectId && styles.selectedChip]}><Text style={styles.chipText}>{project.name}</Text></Pressable>)}</ScrollView><Text style={styles.fieldLabel}>Priority</Text><View style={styles.chipLine}>{priorities.slice(1).map((item) => <Pressable key={item} onPress={() => setPriority(item)} style={[styles.chip, item === priority && styles.selectedChip]}><Text style={styles.chipText}>{item}</Text></Pressable>)}</View><Text style={styles.fieldLabel}>Status</Text><View style={styles.chipLine}>{statuses.slice(1).map((item) => <Pressable key={item} onPress={() => setStatus(item)} style={[styles.chip, item === status && styles.selectedChip]}><Text style={styles.chipText}>{item.replace("_", " ")}</Text></Pressable>)}</View><Field value={dueDate} onChangeText={setDueDate} placeholder="Due date (YYYY-MM-DD)" /><View style={styles.rowButtons}><Button label="Cancel" onPress={onCancel} secondary /><Button label="Save task" onPress={() => name.trim() && projectId && onSave({ name: name.trim(), projectId, priority, status, dueDate })} /></View></View>;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [tab, setTab] = useState<"dashboard" | "tasks" | "projects">("dashboard");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Task | undefined>();
  const [showEditor, setShowEditor] = useState(false);

  const load = async () => { setError(""); try { const [nextDashboard, nextProjects, nextTasks] = await Promise.all([api.dashboard(), api.projects(), api.tasks()]); setDashboard(nextDashboard); setProjects(nextProjects); setTasks(nextTasks); } catch (err) { const message = err instanceof Error ? err.message : "Unable to load workspace."; if (message.includes("expired")) { setUser(null); } setError(message); } };
  useEffect(() => { restoreSession().then(setUser).catch(() => clearSession()).finally(() => setBooting(false)); }, []);
  useEffect(() => { if (user) load(); }, [user]);
  const visibleTasks = useMemo(() => tasks.filter((task) => task.name.toLowerCase().includes(query.toLowerCase()) && (status === "all" || task.status === status) && (priority === "all" || task.priority === priority)), [tasks, query, status, priority]);
  const saveTask = async (data: { name: string; projectId: string; priority: string; status: string; dueDate: string }) => { try { if (editing) await api.updateTask(editing.id, data); else await api.createTask(data); setShowEditor(false); setEditing(undefined); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to save task."); } };
  const complete = async (task: Task) => { try { if (task.status === "completed") await api.updateTask(task.id, { status: "pending" }); else await api.completeTask(task.id); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to update task."); } };
  const remove = (task: Task) => Alert.alert("Delete task?", task.name, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { try { await api.deleteTask(task.id); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Unable to delete task."); } } }]);
  if (booting) return <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>;
  if (!user) return <AuthScreen onAuthenticated={setUser} />;
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  return <SafeAreaView style={styles.screen}><StatusBar barStyle="dark-content" /><View style={styles.header}><View><Text style={styles.eyebrow}>KRAM WORKSPACE</Text><Text style={styles.greeting}>Hi, {user.fullName.split(" ")[0]}.</Text></View><Pressable onPress={async () => { await logout(); setUser(null); }}><Text style={styles.logout}>Log out</Text></Pressable></View>{error ? <Pressable onPress={() => setError("")}><Text style={styles.banner}>{error}  ×</Text></Pressable> : null}<View style={styles.content}>{tab === "dashboard" && <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}><Text style={styles.pageTitle}>Your overview</Text><Text style={styles.pageCopy}>A small view of what is moving today.</Text><View style={styles.stats}>{<Stat label="Projects" value={dashboard?.statistics.totalProjects || 0} />}<Stat label="Tasks" value={dashboard?.statistics.totalTasks || 0} /><Stat label="Completed" value={dashboard?.statistics.completedTasks || 0} /><Stat label="In progress" value={dashboard?.statistics.projectsInProgress || 0} /></View><Text style={styles.sectionTitle}>Recent tasks</Text>{tasks.slice(0, 5).map((task) => <TaskRow key={task.id} task={task} onComplete={() => complete(task)} onEdit={() => { setEditing(task); setShowEditor(true); }} onDelete={() => remove(task)} />)}</ScrollView>}{tab === "tasks" && <View style={styles.flex}><View style={styles.taskToolbar}><TextInput value={query} onChangeText={setQuery} placeholder="Search tasks" placeholderTextColor="#9b9082" style={[styles.input, styles.search]} /><Button label="+ New" onPress={() => { setEditing(undefined); setShowEditor(true); }} /></View><View style={styles.chipLine}>{statuses.map((item) => <Pressable key={item} onPress={() => setStatus(item)} style={[styles.chip, item === status && styles.selectedChip]}><Text style={styles.chipText}>{item.replace("_", " ")}</Text></Pressable>)}</View><View style={styles.chipLine}>{priorities.map((item) => <Pressable key={item} onPress={() => setPriority(item)} style={[styles.chip, item === priority && styles.selectedChip]}><Text style={styles.chipText}>{item}</Text></Pressable>)}</View>{showEditor && <TaskEditor projects={projects} editing={editing} onSave={saveTask} onCancel={() => { setShowEditor(false); setEditing(undefined); }} />}<FlatList data={visibleTasks} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />} renderItem={({ item }) => <TaskRow task={item} onComplete={() => complete(item)} onEdit={() => { setEditing(item); setShowEditor(true); }} onDelete={() => remove(item)} />} ListEmptyComponent={<Text style={styles.empty}>No tasks match this view.</Text>} /></View>}{tab === "projects" && <FlatList data={projects} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />} ListHeaderComponent={<><Text style={styles.pageTitle}>Projects</Text><Text style={styles.pageCopy}>Every project connected to your account.</Text></>} renderItem={({ item }) => <View style={styles.project}><Text style={styles.projectName}>{item.name}</Text><Text style={styles.projectStatus}>{item.status.replace("_", " ")}</Text><Text style={styles.projectDescription}>{item.description}</Text><Text style={styles.projectTasks}>{tasks.filter((task) => task.projectId === item.id).length} tasks</Text></View>} ListEmptyComponent={<Text style={styles.empty}>No projects yet.</Text>} />}</View><View style={styles.tabs}>{(["dashboard", "tasks", "projects"] as const).map((item) => <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}><Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item[0].toUpperCase() + item.slice(1)}</Text></Pressable>)}</View></SafeAreaView>;
}

// @ts-ignore The style map is intentionally kept compact for this starter app.
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper }, authScreen: { flex: 1, backgroundColor: colors.paper }, authInner: { flex: 1, justifyContent: "center", padding: 28 }, center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper }, logo: { color: colors.accent, fontSize: 28, fontWeight: "900", letterSpacing: 4 }, eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1.5 }, authTitle: { color: colors.ink, fontSize: 36, fontWeight: "800", marginTop: 36 }, authCopy: { color: colors.muted, fontSize: 16, lineHeight: 24, marginBottom: 28, marginTop: 10 }, input: { backgroundColor: colors.card, borderColor: colors.line, borderRadius: 10, borderWidth: 1, color: colors.ink, fontSize: 16, marginBottom: 12, padding: 14 }, button: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 10, padding: 15 }, buttonText: { color: colors.white, fontSize: 15, fontWeight: "800" }, secondaryButton: { backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1 }, secondaryButtonText: { color: colors.ink }, switchText: { color: colors.accent, fontSize: 14, fontWeight: "700", marginTop: 20, textAlign: "center" }, error: { color: "#b54432", marginBottom: 12 }, header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 18 }, greeting: { color: colors.ink, fontSize: 26, fontWeight: "800", marginTop: 5 }, logout: { color: colors.accent, fontWeight: "700" }, banner: { backgroundColor: "#f4d6cc", color: "#8d372a", margin: 16, padding: 12, borderRadius: 8 }, content: { flex: 1, padding: 20 }, flex: { flex: 1 }, pageTitle: { color: colors.ink, fontSize: 30, fontWeight: "800", marginTop: 18 }, pageCopy: { color: colors.muted, fontSize: 15, marginBottom: 20, marginTop: 6 }, stats: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 }, stat: { backgroundColor: colors.card, borderColor: colors.line, borderRadius: 12, borderWidth: 1, padding: 15, width: "47%" }, statValue: { color: colors.ink, fontSize: 28, fontWeight: "800" }, statLabel: { color: colors.muted, fontSize: 12, marginTop: 3 }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "800", marginBottom: 12, marginTop: 12 }, taskToolbar: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 18 }, search: { flex: 1, marginBottom: 0 }, chipLine: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 10 }, chip: { backgroundColor: colors.card, borderColor: colors.line, borderRadius: 20, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 }, selectedChip: { backgroundColor: "#f2c6b5", borderColor: colors.accent }, chipText: { color: colors.ink, fontSize: 12, textTransform: "capitalize" }, taskRow: { alignItems: "center", backgroundColor: colors.card, borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: "row", gap: 10, paddingVertical: 14 }, check: { alignItems: "center", borderColor: colors.accent, borderRadius: 12, borderWidth: 1.5, height: 24, justifyContent: "center", width: 24 }, checked: { backgroundColor: colors.sage, borderColor: colors.sage }, checkText: { color: colors.white, fontWeight: "900" }, taskBody: { flex: 1 }, taskName: { color: colors.ink, fontSize: 15, fontWeight: "700" }, done: { color: colors.muted, textDecorationLine: "line-through" }, taskMeta: { color: colors.muted, fontSize: 10, marginTop: 4, textTransform: "capitalize" }, action: { color: colors.accent, fontSize: 12, fontWeight: "700" }, delete: { color: "#b54432" }, editor: { backgroundColor: "#f1e6d8", borderRadius: 12, marginBottom: 12, padding: 14 }, fieldLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", marginBottom: 7, marginTop: 2, textTransform: "uppercase" }, rowButtons: { flexDirection: "row", gap: 8, marginTop: 8 }, rowButtons: { flexDirection: "row", gap: 8, marginTop: 8 }, project: { backgroundColor: colors.card, borderColor: colors.line, borderRadius: 12, borderWidth: 1, marginBottom: 12, padding: 16 }, projectName: { color: colors.ink, fontSize: 17, fontWeight: "800" }, projectStatus: { color: colors.sage, fontSize: 11, fontWeight: "800", marginTop: 4, textTransform: "uppercase" }, projectDescription: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 10 }, projectTasks: { color: colors.accent, fontSize: 12, fontWeight: "700", marginTop: 12 }, empty: { color: colors.muted, padding: 30, textAlign: "center" }, tabs: { backgroundColor: colors.card, borderTopColor: colors.line, borderTopWidth: 1, flexDirection: "row", paddingBottom: 8, paddingTop: 8 }, tab: { alignItems: "center", flex: 1, padding: 9 }, activeTab: { borderBottomColor: colors.accent, borderBottomWidth: 2 }, tabText: { color: colors.muted, fontSize: 12, fontWeight: "700" }, activeTabText: { color: colors.accent }
});

export default App;
