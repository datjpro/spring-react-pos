package com.pos.service;

import com.pos.dto.request.*;
import com.pos.dto.response.*;
import com.pos.entity.BranchEntity;
import com.pos.repository.BranchRepository;
import com.pos.common.exception.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class BranchServiceImpl implements BranchService {
    private final BranchRepository branchRepository;
    public BranchServiceImpl(BranchRepository branchRepository){this.branchRepository=branchRepository;}
    @Transactional public BranchResponse create(BranchRequest request){ if(branchRepository.existsByCodeIgnoreCase(request.code())) throw new DuplicateResourceException("Branch code already exists"); BranchEntity e=new BranchEntity(); apply(e,request); return map(branchRepository.save(e));}
    @Transactional public BranchResponse update(Long id, BranchRequest request){ BranchEntity e=find(id); apply(e,request); return map(branchRepository.save(e));}
    public List<BranchResponse> findAll(){return branchRepository.findByActiveTrueOrderByNameAsc().stream().map(this::map).toList();}
    @Transactional public void delete(Long id){BranchEntity e=find(id); e.setActive(false);}
    private BranchEntity find(Long id){return branchRepository.findByIdAndActiveTrue(id).orElseThrow(() -> new ResourceNotFoundException("Branch not found"));}
    private void apply(BranchEntity e, BranchRequest r){e.setCode(r.code()); e.setName(r.name()); e.setAddress(r.address());}
    private BranchResponse map(BranchEntity e){return new BranchResponse(e.getId(),e.getCode(),e.getName(),e.getAddress(),e.isActive());}
}
