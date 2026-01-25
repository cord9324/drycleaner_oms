
-- 1. PROFILES TABLE (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'STAFF' CHECK (role IN ('ADMIN', 'MANAGER', 'STAFF')),
  avatar TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin or manager
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('ADMIN', 'MANAGER')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_all_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_insert_management" ON public.profiles;
CREATE POLICY "profiles_insert_management"
  ON public.profiles
  FOR INSERT
  WITH CHECK (public.is_admin_or_manager());

DROP POLICY IF EXISTS "profiles_update_own_or_management" ON public.profiles;
CREATE POLICY "profiles_update_own_or_management"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.is_admin_or_manager());

DROP POLICY IF EXISTS "profiles_delete_management" ON public.profiles;
CREATE POLICY "profiles_delete_management"
  ON public.profiles
  FOR DELETE
  USING (public.is_admin_or_manager());

-- 2. TIME LOGS TABLE (For Clock-in/Clock-out)
CREATE TABLE IF NOT EXISTS public.time_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  clock_in TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- ===============================
-- STAFF can see their own logs
-- ===============================
DROP POLICY IF EXISTS "Users can view own logs" ON public.time_logs;

CREATE POLICY "Users can view own logs" 
ON public.time_logs 
FOR SELECT 
USING (auth.uid() = user_id);



-- ===============================
-- ADMIN/MANAGER can see all logs
-- ===============================
DROP POLICY IF EXISTS "Management can view all logs" ON public.time_logs;

CREATE POLICY "Management can view all logs"
ON public.time_logs
FOR SELECT
USING (public.is_admin_or_manager());



-- ===============================
-- Users can insert their own logs
-- ===============================
DROP POLICY IF EXISTS "Users can clock in" ON public.time_logs;

CREATE POLICY "Users can clock in"
ON public.time_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);



-- ===============================
-- Users can update their own logs
-- ===============================
DROP POLICY IF EXISTS "Users can clock out" ON public.time_logs;

CREATE POLICY "Users can clock out"
ON public.time_logs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. STORES TABLE
CREATE TABLE IF NOT EXISTS public.stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stores_select_all_authenticated" ON public.stores;
CREATE POLICY "stores_select_all_authenticated"
  ON public.stores
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "stores_modify_management" ON public.stores;
CREATE POLICY "stores_modify_management"
  ON public.stores
  FOR ALL
  USING (public.is_admin_or_manager());

-- 4. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  total_spent DECIMAL(12,2) DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_select_all_authenticated" ON public.customers;
CREATE POLICY "customers_select_all_authenticated"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "customers_insert_authenticated" ON public.customers;
CREATE POLICY "customers_insert_authenticated"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "customers_update_authenticated" ON public.customers;
CREATE POLICY "customers_update_authenticated"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "customers_delete_management" ON public.customers;
CREATE POLICY "customers_delete_management"
  ON public.customers
  FOR DELETE
  USING (public.is_admin_or_manager());


-- 5. SERVICE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.service_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_categories_select_all_authenticated" ON public.service_categories;
CREATE POLICY "service_categories_select_all_authenticated"
  ON public.service_categories
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "service_categories_modify_management" ON public.service_categories;
CREATE POLICY "service_categories_modify_management"
  ON public.service_categories
  FOR ALL
  USING (public.is_admin_or_manager());

-- 6. KANBAN COLUMNS TABLE
CREATE TABLE IF NOT EXISTS public.kanban_columns (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  status TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kanban_columns_select_all_authenticated" ON public.kanban_columns;
CREATE POLICY "kanban_columns_select_all_authenticated"
  ON public.kanban_columns
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "kanban_columns_modify_management" ON public.kanban_columns;
CREATE POLICY "kanban_columns_modify_management"
  ON public.kanban_columns
  FOR ALL
  USING (public.is_admin_or_manager());

-- 7. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  hanger_number TEXT,
  customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  status TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  pickup_date DATE,
  pickup_time TIME,
  is_priority BOOLEAN DEFAULT FALSE,
  store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL,
  special_handling TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_all_authenticated" ON public.orders;
CREATE POLICY "orders_select_all_authenticated"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "orders_insert_authenticated" ON public.orders;
CREATE POLICY "orders_insert_authenticated"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "orders_update_authenticated" ON public.orders;
CREATE POLICY "orders_update_authenticated"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "orders_delete_management" ON public.orders;
CREATE POLICY "orders_delete_management"
  ON public.orders
  FOR DELETE
  USING (public.is_admin_or_manager());

-- 8. AUTH SYNC TRIGGER (Auth -> Profile)
-- This function handles both account creation and profile updates
CREATE OR REPLACE FUNCTION public.sync_auth_to_profiles()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.profiles (id, name, email, role, avatar)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      NEW.email,
      COALESCE(
        (NEW.raw_user_meta_data->>'role')::public.user_role,
        CASE 
          WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 'ADMIN'::public.user_role 
          ELSE 'STAFF'::public.user_role 
        END
      ),
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    UPDATE public.profiles
    SET 
      name = COALESCE(NEW.raw_user_meta_data->>'name', name),
      email = NEW.email,
      role = COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'role', '')::public.user_role,
        role
      )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for both INSERT and UPDATE on auth.users
DROP TRIGGER IF EXISTS on_auth_user_changed ON auth.users;
CREATE TRIGGER on_auth_user_changed
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_auth_to_profiles();


-- 9. AUTH DELETION TRIGGER (Profile -> Auth)
-- This function allows the public schema to delete from the protected auth schema
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- 10. APP SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY,
  tax_rate DECIMAL(5,4) DEFAULT 0.08,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_select_all" ON public.app_settings;
CREATE POLICY "app_settings_select_all"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "app_settings_update_management" ON public.app_settings;
CREATE POLICY "app_settings_update_management"
  ON public.app_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_manager());

-- 11. INITIAL SEED DATA
INSERT INTO public.app_settings (id, tax_rate)
VALUES ('default', 0.08)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stores (id, name, address)
VALUES 
('s1768827068272', '200 Cleaners (SR 200 Location)', '5400 SW College Rd Ste 302, Ocala, FL'),
('s1768827161944', '200 Cleaners (SR 475 Location)', '3045 SE 3rd Ave, Ocala, FL 34471-0423')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.kanban_columns (id, label, status, color, position)
VALUES 
('col1', 'Received', 'RECEIVED', 'bg-slate-400', 0),
('col2', 'Cleaning', 'CLEANING', 'bg-blue-500', 1),
('col3', 'Ready', 'READY', 'bg-emerald-500', 2),
('col4', 'Completed', 'COMPLETED', 'bg-indigo-500', 3),
('col5', 'On Hold', 'HOLD', 'bg-amber-500', 4)
ON CONFLICT (status) DO UPDATE SET label = EXCLUDED.label, color = EXCLUDED.color, position = EXCLUDED.position;

INSERT INTO public.service_categories (id, name, service_type, base_price)
VALUES 
('sc1', 'Suit (2-Piece)', 'Dry Clean', 15.00),
('sc2', 'Dress Shirt', 'Launder', 4.50),
('sc3', 'Evening Gown', 'Dry Clean', 25.00),
('sc4', 'Hemming', 'Alteration', 12.00),
('sc5', 'Winter Coat', 'Specialty', 22.50)
ON CONFLICT (id) DO NOTHING;
