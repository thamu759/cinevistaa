import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _loginUsernameController = TextEditingController();
  final _loginPasswordController = TextEditingController();
  final _registerUsernameController = TextEditingController();
  final _registerEmailController = TextEditingController();
  final _registerPasswordController = TextEditingController();
  bool _showPassword = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _loginUsernameController.dispose();
    _loginPasswordController.dispose();
    _registerUsernameController.dispose();
    _registerEmailController.dispose();
    _registerPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Thirai', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            const Text('Pedia', style: TextStyle(color: Color(0xFFE50914), fontWeight: FontWeight.w300)),
          ],
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            TabBar(
              controller: _tabController,
              labelColor: const Color(0xFFE50914),
              unselectedLabelColor: Colors.white54,
              indicatorColor: const Color(0xFFE50914),
              tabs: const [
                Tab(text: 'Login'),
                Tab(text: 'Register'),
              ],
            ),
            const SizedBox(height: 24),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildLoginForm(auth),
                  _buildRegisterForm(auth),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoginForm(AuthProvider auth) {
    return SingleChildScrollView(
      child: Column(
        children: [
          if (auth.error != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
              ),
              child: Text(auth.error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
            ),
          TextField(
            controller: _loginUsernameController,
            decoration: const InputDecoration(hintText: 'Username', prefixIcon: Icon(Icons.person, color: Colors.white38)),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _loginPasswordController,
            obscureText: !_showPassword,
            decoration: InputDecoration(
              hintText: 'Password',
              prefixIcon: const Icon(Icons.lock, color: Colors.white38),
              suffixIcon: IconButton(
                icon: Icon(_showPassword ? Icons.visibility : Icons.visibility_off, color: Colors.white38),
                onPressed: () => setState(() => _showPassword = !_showPassword),
              ),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: auth.isLoading ? null : () async {
                final success = await auth.login(
                  _loginUsernameController.text.trim(),
                  _loginPasswordController.text,
                );
                if (success && mounted) {
                  Navigator.pop(context);
                }
              },
              child: auth.isLoading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Login'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRegisterForm(AuthProvider auth) {
    return SingleChildScrollView(
      child: Column(
        children: [
          if (auth.error != null)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
              ),
              child: Text(auth.error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
            ),
          TextField(
            controller: _registerUsernameController,
            decoration: const InputDecoration(hintText: 'Username', prefixIcon: Icon(Icons.person, color: Colors.white38)),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _registerEmailController,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(hintText: 'Email', prefixIcon: Icon(Icons.mail, color: Colors.white38)),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _registerPasswordController,
            obscureText: !_showPassword,
            decoration: InputDecoration(
              hintText: 'Password',
              prefixIcon: const Icon(Icons.lock, color: Colors.white38),
              suffixIcon: IconButton(
                icon: Icon(_showPassword ? Icons.visibility : Icons.visibility_off, color: Colors.white38),
                onPressed: () => setState(() => _showPassword = !_showPassword),
              ),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: auth.isLoading ? null : () async {
                final success = await auth.register(
                  _registerUsernameController.text.trim(),
                  _registerEmailController.text.trim(),
                  _registerPasswordController.text,
                );
                if (success && mounted) Navigator.pop(context);
              },
              child: auth.isLoading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Create Account'),
            ),
          ),
        ],
      ),
    );
  }
}
