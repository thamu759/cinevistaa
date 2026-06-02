import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/list_provider.dart';
import '../../providers/auth_provider.dart';

class ListsScreen extends StatefulWidget {
  const ListsScreen({super.key});

  @override
  State<ListsScreen> createState() => _ListsScreenState();
}

class _ListsScreenState extends State<ListsScreen> {
  bool _showCreateList = false;
  final _nameController = TextEditingController();
  final _descController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ListProvider>().loadAllLists();
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final listProvider = context.watch<ListProvider>();
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Movie Lists'),
        actions: [
          if (auth.isLoggedIn)
            IconButton(
              icon: const Icon(Icons.add, color: Colors.white),
              onPressed: () => setState(() => _showCreateList = !_showCreateList),
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_showCreateList) _buildCreateForm(listProvider, auth),
          if (listProvider.isLoading)
            const Center(child: CircularProgressIndicator())
          else if (listProvider.allLists.isEmpty)
            const Center(child: Text('No lists yet', style: TextStyle(color: Colors.white54)))
          else
            ...listProvider.allLists.map((list) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text(list.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                subtitle: Text(list.description.isNotEmpty ? list.description : 'No description',
                    style: const TextStyle(color: Colors.white54)),
                trailing: Text('${list.movieIds.length} movies',
                    style: const TextStyle(color: Colors.white38)),
                onTap: () => Navigator.pushNamed(context, '/list-detail', arguments: list.id),
              ),
            )),
        ],
      ),
    );
  }

  Widget _buildCreateForm(ListProvider listProvider, AuthProvider auth) {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(hintText: 'List name'),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _descController,
            decoration: const InputDecoration(hintText: 'Description (optional)'),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () async {
                if (_nameController.text.trim().isEmpty) return;
                await listProvider.createList(
                  _nameController.text.trim(),
                  _descController.text.trim(),
                );
                _nameController.clear();
                _descController.clear();
                setState(() => _showCreateList = false);
                if (mounted) {
                  listProvider.loadAllLists();
                  if (auth.currentUser != null) {
                    listProvider.loadUserLists(auth.currentUser!.username);
                  }
                }
              },
              child: const Text('Create List'),
            ),
          ),
        ],
      ),
    );
  }
}
