# Cartiva TODO

- [ ] Backend: Normalize product fields (stock + deliveryOption) so Admin UI and frontend agree
- [ ] Backend: Make `/api/orders` strict source-of-truth; stop checkout from reporting success when DB save fails (remove/guard localStorage fallback)
- [ ] Backend: Implement missing admin reset endpoint OR remove reset UI (admin.html)
- [ ] Backend: Fix static serving so root HTML files are served correctly (or document correct deployment)
- [ ] Backend/Frontend: Verify Google login session + API base resolution
- [ ] Run local tests: store load, admin product CRUD, checkout order save, customer my-orders load

