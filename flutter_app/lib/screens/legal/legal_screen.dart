import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../models/watch_provider.dart';

class LegalScreen extends StatefulWidget {
  final String page;
  const LegalScreen({super.key, required this.page});

  @override
  State<LegalScreen> createState() => _LegalScreenState();
}

class _LegalScreenState extends State<LegalScreen> {
  PageContent? _content;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ApiService().fetchPageContent(widget.page);
      setState(() {
        _content = PageContent.fromJson(data);
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_content?.title ?? widget.page)),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _content == null
              ? const Center(child: Text('Content not found'))
              : ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    if (_content!.updated != null)
                      Text('Updated: ${_content!.updated}',
                          style: const TextStyle(color: Colors.white54, fontSize: 12)),
                    const SizedBox(height: 16),
                    ..._content!.sections.map((s) => Padding(
                      padding: const EdgeInsets.only(bottom: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(s.heading, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                          const SizedBox(height: 8),
                          Text(s.text, style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.5)),
                        ],
                      ),
                    )),
                  ],
                ),
    );
  }
}
