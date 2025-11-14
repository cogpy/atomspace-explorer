/**
 * Created by tsadik on 11/8/17.
 */
import { Injectable } from '@angular/core';
import {Link} from "../models/link";
import {Graph} from "../models/graph";
import {Node} from "../models/node";

declare var d3:any;

@Injectable()
export class VisualizerService {
  nodes:Node[] = [];
  links:Link[] = [];
  private atomIdMap: Map<any, string> = new Map();
  private nextId: number = 1;
  
  constructor() { }
  
  public getParsedJson(atoms):Graph{
    let parsedJson: Graph = <Graph>{};
    // Reset ID tracking for each parse
    this.atomIdMap.clear();
    this.nextId = 1;
    
    // Normalize atoms to flat array with handles/IDs
    const normalizedAtoms = this.normalizeAtoms(atoms);
    
    this.getNodes(normalizedAtoms);
    this.getLinks(normalizedAtoms);
    parsedJson.nodes = this.nodes;
    parsedJson.links = this.links;
    return parsedJson;
  }
  
  /**
   * Normalize atoms to a consistent format with handles/IDs.
   * Supports both old format (with handles) and new format (nested atoms).
   */
  private normalizeAtoms(atoms: any[]): any[] {
    const normalized = [];
    const atomMap = new Map();
    
    // First pass: flatten nested atoms and assign IDs
    const flattenAtom = (atom: any, depth: number = 0): string => {
      // Generate a unique key for this atom
      const key = JSON.stringify({ type: atom.type, name: atom.name || '' });
      
      if (atomMap.has(key)) {
        return atomMap.get(key);
      }
      
      const id = atom.handle || this.generateId();
      atomMap.set(key, id);
      
      const flatAtom: any = {
        handle: id,
        type: atom.type,
        name: atom.name || '',
        incoming: atom.incoming || [],
        outgoing: [],
        attentionvalue: atom.attentionvalue || atom.av || { sti: 0, lti: 0, vlti: false },
        truthvalue: atom.truthvalue || atom.tv || { type: 'simple', details: { strength: 1.0, confidence: 0.0, count: 0.0 } }
      };
      
      // Process outgoing links
      if (atom.outgoing && Array.isArray(atom.outgoing)) {
        if (atom.outgoing.length > 0) {
          if (typeof atom.outgoing[0] === 'object') {
            // New format: outgoing contains nested atoms
            flatAtom.outgoing = atom.outgoing.map(child => flattenAtom(child, depth + 1));
          } else {
            // Old format: outgoing contains handles
            flatAtom.outgoing = atom.outgoing;
          }
        }
      }
      
      normalized.push(flatAtom);
      return id;
    };
    
    // Flatten all atoms
    atoms.forEach(atom => flattenAtom(atom));
    
    return normalized;
  }
  
  private generateId(): string {
    return 'atom_' + (this.nextId++);
  }
  private getNodes(atoms){
    this.nodes = []
    for(let i = 0;i<atoms.length;i++){
      let node:Node = <Node>{};
      if (atoms[i].name != '') {
        node.id = atoms[i].handle;
        node.name = atoms[i].name;
        node.group = atoms[i].type;
        node.type = atoms[i].type;
        node.av = atoms[i].attentionvalue;
        node.tv = atoms[i].truthvalue;
        node.incoming = atoms[i].incoming;
        node.outgoing = atoms[i].outgoing;
        this.nodes.push(node);
      }
    }
  }
  private isInNodes(handle,nodes){
    for(let i = 0;i < nodes.length;i++){
      if (nodes[i].id == handle.toString()) {
        return true;
      }
    }
  }
  private getLinks(atoms){
    this.links = []
    for(let i = 0; i < atoms.length ;i++){
      if (atoms[i].name == '') {
        let outgoing = atoms[i].outgoing;
        let incoming = atoms[i].incoming;
        let label = atoms[i].type;
        let handle = atoms[i].handle;
        let av = atoms[i].attentionvalue;
        let tv = atoms[i].truthvalue;
        if (outgoing.length == 1) {
          let linkNode:Node = <Node>{};
          let link:Link = <Link>{};
          link.source = handle;
          link.target = outgoing[0];
          link.name = label;
          link.id = handle;
          link.av = av;
          link.tv = tv;
          linkNode.id = handle;
          linkNode.name = '';
          linkNode.group = label;
          linkNode.type = label;
          linkNode.av = av;
          linkNode.tv = tv;
          linkNode.incoming = incoming;
          linkNode.outgoing = outgoing;
          this.links.push(link);
          this.nodes.push(linkNode);
        } else if (outgoing.length == 2) {
          if (incoming.length == 0) {
            let link:Link = <Link>{};
            link.source = outgoing[0];
            link.target = outgoing[1];
            link.name = label;
            link.id = handle;
            link.av = av;
            link.tv = tv;
            link.incoming = incoming;
            link.outgoing = outgoing;
            this.links.push(link);
          }else {
            let linkNode:Node = <Node>{};
            let link1:Link = <Link>{};
            let link2:Link = <Link>{};
            linkNode.id = handle;
            linkNode.name = '';
            linkNode.group = label;
            linkNode.type = label;
            linkNode.av = av;
            linkNode.tv = tv;
            linkNode.incoming = incoming;
            linkNode.outgoing = outgoing;
            link1.source = handle;
            link1.target = outgoing[0];
            link1.name = label;
            link1.id = handle;
            link1.av = av;
            link1.tv = tv;
            link1.incoming = incoming;
            link1.outgoing = outgoing[0];
            link2.source = handle;
            link2.target = outgoing[1];
            link2.name = label;
            link2.id = handle;
            link2.av = av;
            link2.tv = tv;
            link2.incoming = incoming;
            link2.outgoing = outgoing[1];
            this.nodes.push(linkNode);
            this.links.push(link1);
            this.links.push(link2);
          }
        }else if (outgoing.length > 2) {
          let linkNode:Node = <Node>{};
          linkNode.id = handle;
          linkNode.name = '';
          linkNode.group = label;
          linkNode.type = label;
          linkNode.av = av;
          linkNode.tv = tv;
          linkNode.incoming = incoming;
          linkNode.outgoing = outgoing;
          this.nodes.push(linkNode);
          for(let k = 0; k < outgoing.length; k++){
            let link:Link = <Link>{};
            link.source = handle;
            link.target = outgoing[k];
            link.name = label;
            link.id = handle;
            link.av = av;
            link.tv = tv;
            link.incoming = incoming;
            link.outgoing = outgoing;
            this.links.push(link);
          }
        }
      }

    }
  }
}
