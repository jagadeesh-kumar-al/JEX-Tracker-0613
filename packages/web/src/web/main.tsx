// Entry point referenced by index.html — composition only, real bootstrap
// lives in __main.tsx (template-managed). The returning managed-auth redirect
// leg is finished inside <AuthGate /> before the app decides it has no session.
import "./__main";
