import 'package:flutter/material.dart';

class MoodMatcherScreen extends StatefulWidget {
  const MoodMatcherScreen({super.key});

  @override
  State<MoodMatcherScreen> createState() => _MoodMatcherScreenState();
}

class _MoodMatcherScreenState extends State<MoodMatcherScreen> {
  String? _selectedMood;
  String? _recommendation;

  final _moodMovies = {
    'Exciting': 'Mad Max: Fury Road',
    'Thoughtful': 'Interstellar',
    'Funny': 'The Grand Budapest Hotel',
    'Dark': 'The Batman',
    'Romantic': 'La La Land',
    'Intense': 'Whiplash',
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mood Matcher')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('How are you feeling today?',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 32),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              alignment: WrapAlignment.center,
              children: _moodMovies.keys.map((mood) => GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedMood = mood;
                    _recommendation = _moodMovies[mood];
                  });
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  decoration: BoxDecoration(
                    color: _selectedMood == mood
                        ? const Color(0xFFE50914)
                        : const Color(0xFF1A1A2E),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(mood, style: TextStyle(
                    color: _selectedMood == mood ? Colors.white : Colors.white70,
                    fontWeight: FontWeight.w600,
                  )),
                ),
              )).toList(),
            ),
            if (_recommendation != null) ...[
              const SizedBox(height: 48),
              const Text('We recommend:', style: TextStyle(color: Colors.white54, fontSize: 16)),
              const SizedBox(height: 12),
              Text(_recommendation!, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
            ],
          ],
        ),
      ),
    );
  }
}
