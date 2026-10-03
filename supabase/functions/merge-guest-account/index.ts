import { adminClient } from "../_shared/admin.ts";
import { createMergeHandler } from "./handler.ts";

Deno.serve(createMergeHandler(adminClient));
