# Backend Package Structure (Refactored)

The Spring Boot backend (`backend/src/main/java/com/example/lissomsoft/tms/`) has been
reorganized from **package-by-feature** (`trxnmaster/`, `studentdet/`, `auth/`, `crypto/`, ...)
to **package-by-layer**, which is the more common convention for small/medium Spring Boot
services and keeps each architectural concern in one place:

```
com.example.lissomsoft.tms
├── TrainingManagementSystemApplication.java   (application entry point)
├── controller/    9 REST controllers (one per module + Auth)
├── service/       9 @Service classes containing business logic
├── repository/    9 Spring Data JPA repositories
├── entity/        13 JPA @Entity classes + their composite @IdClass keys
├── dto/           Request/response payloads: LoginRequest, LoginResponse,
│                  CurrentUser, ErrorResponse
├── config/        @Configuration classes: SecurityConfig, CorsConfig,
│                  EncryptionFilterConfig
├── exception/     ApiException + GlobalExceptionHandler (@RestControllerAdvice)
├── security/      JWT + role/auth machinery: JwtService, JwtAuthenticationFilter,
│                  AuthenticatedPrincipal, Role, EncryptionFilter
├── util/          Generic, reusable helpers: AesGcmCipher, BufferedResponseWrapper,
│                  DecryptedRequestWrapper
└── runner/        CommandLineRunner startup tasks: DataSeeder, LegacyIdMigrator
```

## What changed
- **No behavior changed.** Every class keeps its original name, fields, and logic.
  Only the package (and therefore the file location and `import`s) changed.
- **Visibility fixes required by the new layout**: `EncryptionFilter`'s constructor and
  `BufferedResponseWrapper`/`DecryptedRequestWrapper`'s constructors/methods were widened
  from package-private to `public`, since they're now called from a different package
  (`security` calling into `util`, `config` calling into `security`). This is the only
  functional-adjacent change, and it's required for the split to compile — it doesn't
  change what the code does.
- **`AuthController.CurrentUser`** was pulled out of its nested-record form into its own
  top-level class at `dto/CurrentUser.java`, matching how `LoginRequest`/`LoginResponse`
  are already modeled.
- **`ErrorResponse`** moved from `exception/` to `dto/`, since it's a response payload
  shape rather than exception-handling logic — `exception/` now holds only
  `ApiException` and `GlobalExceptionHandler`.
- **`runner/`** is a small addition beyond the requested Controller/Service/Repository/
  Entity/DTO/Config/Exception/Utility/Security set, to give the two `CommandLineRunner`
  startup beans (`DataSeeder`, `LegacyIdMigrator`) a clear home instead of cramming
  bootstrap-only logic into `config/`.

## Why this structure
- **SRP / SOLID**: each package now has exactly one reason to change — a new REST
  endpoint touches only `controller/`, a new business rule touches only `service/`, etc.
- **Spring Boot convention**: `@SpringBootApplication` still sits at the package root
  (`com.example.lissomsoft.tms`), so component scanning automatically covers every
  subpackage — no scanning configuration changes were needed.
- **Discoverability**: anyone new to the codebase can find "all the REST endpoints" or
  "all the database access" in one folder instead of hunting through nine
  feature folders.
